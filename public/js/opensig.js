// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.


/**
 * Retrieves all signatures on the current blockchain for the given file.
 * 
 * @param {File} file the file to verify
 * @returns Array of signature events or empty array if none
 * @throws BlockchainNotSupportedError
 * @throws APIError returned by the endpoint if the fetch fails
 */
async function verify(file) {

  function _discoverSignatures(documentHash) {
    const network = getBlockchain();
    if (network === undefined) throw new BlockchainNotSupportedError();
    const signatureEvents = [];
    const hashes = new HashIterator(documentHash);
  
    async function _discoverNext(n) {
      const eSigs = await hashes.next(n);
      const strEsigs = eSigs.map(s => {return _buf2hex(s)});
      const request = network.api.requests.getSignatures(strEsigs);
  
      return _safeFetch(network.api.endpoint, request)
        .then(events => {
          signatureEvents.push(events);
          if (events.length !== network.api.maxTopics) return signatureEvents;
          return _discoverNext(network.api.maxTopics);
        })
    }
  
    return _discoverNext(network.api.maxTopics);
  
  }
  
  return hashFile(file)
    .then(_discoverSignatures);
}


/**
 * Hashes the given data buffer
 * @param {Buffer} data 
 * @returns 32-byte hash as ArrayBuffer
 */
function hash(data) {
  return window.crypto.subtle.digest('SHA-256', data);
}


/**
 * Hashes the given File
 * @param {File} file the file to hash
 * @returns 32-byte hash as ArrayBuffer
 */
async function hashFile(file) {
  return readFile(file)
    .then(data => {
      return window.crypto.subtle.digest('SHA-256', data);
    })
}


// RESTful utils

async function _safeFetch(uri, request) {
  return fetch(uri, request)
    .then(response => {
      if (!response.ok) {
        return response.text()
          .then(message => { 
            return Promise.reject(new APIError(response.status, message.trim())) 
          });
      }
      return response.text();
    })
    .then(responseObj => { return JSON.parse(responseObj).result })
  }


// Hashing utils

/**
 * Generates the sequence of signature hashes for a document hash in accordance with the OpenSig standard.
 * Use `next` to retrieve the next `n` hashes.  The iterator will only generate hashes when the `next` function is
 * called.
 */
class HashIterator {

  hashes = [];
  hashPtr = -1;

  constructor(documentHash) {
    this.documentHash = documentHash;
  }

  async next(n=1) {
    if (this.hashes.length === 0) this.hashes.push(await hash(this.documentHash));
    for (let i=this.hashes.length; i<=this.hashPtr+n; i++) {
      this.hashes.push(await hash(_concatBuffers(this.documentHash, this.hashes[i-1])));
    }
    return this.hashes.slice(this.hashPtr+1, this.hashPtr+=n);
  }

  current() { return this.hashPtr >= 0 ? this.hashes(this.hashPtr) : undefined }

  currentIndex() { return this.hashPtr }

  indexAt(i) { return i < this.hashes.length ? this.hashes[i] : undefined }

  reset(n=0) { this.hashPtr = n }

  size() { return this.hashPtr }

}


// File utils

/**
 * Reads the given file and returns the contents as an ArrayBuffer
 * @param {File} file 
 * @returns ArrayBuffer
 */
function readFile(file) {
  return new Promise( (resolve, reject) => {
    var reader = new FileReader();
    reader.onload = () => { resolve(reader.result) };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  })
}


// Utility functions

function _buf2hex(buffer) { // buffer is an ArrayBuffer
  return '0x'+[...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

function _concatBuffers(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
}


// Errors

class APIError extends Error {
  constructor(status, error) {
    super(error);
    this.status = status;
  }
}

class BlockchainNotSupportedError extends Error {
  constructor() {
    super("Blockchain not supported");
  }
}


// Module exports

export const opensig = {
  verify: verify,
  hash: hash,
  hashFile: hashFile,
  HashIterator: HashIterator,
  errors: {
    APIError: APIError,
    BlockchainNotSupportedError: BlockchainNotSupportedError
  }
}


