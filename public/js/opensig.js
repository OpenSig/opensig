// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

const SIG_DATA_VERSION = '00';
const SIG_DATA_ENCRYPTED_FLAG = 128;
const SIG_DATA_TYPE_STRING = 0;
const SIG_DATA_TYPE_BYTES = 1;

const state = {
  file: undefined,
  hashes: undefined,
  lastSignatureIndex: -1
}

async function sign(data) {
  if (state.hashes === undefined) throw new Error("Must verify file before signing it");

  const network = getBlockchain();
  if (network === undefined) throw new BlockchainNotSupportedError();
  const web3 = new Web3(window.ethereum);

  state.hashes.reset(state.lastSignatureIndex);

  return state.hashes.next()
    .then(signatures => {
      const signature = _buf2hex(signatures[0]);
      const encodedData = encodeData(data);

      console.log("registering signature:", signature, "with data ", encodedData);

      const contract = new web3.eth.Contract(network.contract.abi, network.contract.address);

      const transactionParameters = {
        to: network.contract.address,
        from: window.ethereum.selectedAddress,
        value: 0,
        data: contract.methods.registerSignature(signature, encodedData).encodeABI(), 
      };
      
      return ethereum.request({ method: 'eth_sendTransaction', params: [transactionParameters] })
        .then(txHash => { console.log('tx hash:', txHash) });

    })
}

function encodeData(data) {
  if (data.content === undefined || data.content === '') return '0x';
  let type = data.encrypted ? SIG_DATA_ENCRYPTED_FLAG : 0;
  let encData = '';

  switch (data.type) {
    case 'string':
      type += SIG_DATA_TYPE_STRING;
      encData = unicodeStrToHex(data.content);
      break;

    case 'hex':
      type += SIG_DATA_TYPE_BYTES;
      encData = data.slice(0,2) === '0x' ? data.slice(2) : data;
      break;

    default:
      throw new Error("encodeData: invalid type '"+data.type+"'");
  }

  if (data.encrypted) encData = encrypt(encData);

  const typeStr = ('00' + type.toString(16)).slice(-2);
  return '0x'+SIG_DATA_VERSION + typeStr + encData;
}

function decodeData(encData) {
  if (encData === undefined || encData === '') return {type: 'none'}
  if (encData.length < 6) return {type: "invalid", content: "data is < 6 bytes"}
  const version = encData.slice(2,4);
  const typeField = parseInt(encData.slice(4,6), 16);
  const encrypted = typeField & SIG_DATA_ENCRYPTED_FLAG ? true : false;
  const type = typeField & ~SIG_DATA_ENCRYPTED_FLAG;
  const data = {
    version: version,
    encrypted: encrypted
  }

  switch (type) {
    case SIG_DATA_TYPE_STRING:
      data.type = 'string';
      data.content = unicodeHexToStr(encData.slice(6));
      break;
    
    case SIG_DATA_TYPE_BYTES:
      data.type = 'hex';
      data.content = '0x'+encData.slice(6)
      break;

    default:
      data.type = 'invalid';
      data.content = "unrecognised type: "+type+" (version="+version+")";
  }

  return data;
}

function encrypt(dataStr) {
  // todo
  return dataStr;
}


/**
 * Retrieves all signatures on the current blockchain for the given file.
 * 
 * @param {File} file the file to verify
 * @returns Array of signature events or empty array if none
 * @throws BlockchainNotSupportedError
 * @throws APIError returned by the endpoint if the fetch fails
 */
async function verify(file) {
  state.file = file;
  state.hashes = undefined;
  state.lastSignatureIndex = undefined;
  console.log("verifying file", file.name);
  return hashFile(file)
    .then(_discoverSignatures);
}


function _discoverSignatures(documentHash) {
  console.log("discovering signatures for document", _buf2hex(documentHash));
  const network = getBlockchain();
  if (network === undefined) throw new BlockchainNotSupportedError();

  const signatureEvents = [];
  state.hashes = new HashIterator(documentHash);
  state.lastSignatureIndex = -1;

  async function _discoverNext(n) {
    const eSigs = await state.hashes.next(n);
    const strEsigs = eSigs.map(s => {return _buf2hex(s)});
    console.log("querying the blockchain for signatures: ", strEsigs);
    const request = network.api.requests.getSignatures(strEsigs);

    return _safeFetch(network.api.endpoint, request)
      .then(events => {
        console.log("found events:", events);
        const parsedEvents = events.map(e => network.api.encoders.decodeSignatureEvent(e, decodeData));
        signatureEvents.push(...parsedEvents);

        // update state index of most recent signature
        parsedEvents.forEach(e => {
          const sigNumber = state.hashes.indexOf(e.signature);
          if (sigNumber > state.lastSignatureIndex) state.lastSignatureIndex = sigNumber;
        });
        
        // discover more signatures if necessary
        if (events.length !== network.api.maxTopics) {
          return { file: state.file, hash: documentHash, signatures: signatureEvents };
        }
        return _discoverNext(network.api.maxTopics);
      })
  }

  return _discoverNext(network.api.maxTopics);

}

async function reverify() {
  if (state.hashes === undefined) return Promise.reject("nothing to reverify");
  return _discoverSignatures(state.hashes.documentHash);
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
    return this.hashes.slice(this.hashPtr+1, (this.hashPtr+=n)+1);
  }

  current() { return this.hashPtr >= 0 ? this.hashes(this.hashPtr) : undefined }

  currentIndex() { return this.hashPtr }

  indexAt(i) { return i < this.hashes.length ? this.hashes[i] : undefined }

  indexOf(hash) { return this.hashes.map(h => { return _buf2hex(h) }).indexOf(hash) }

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

function unicodeStrToHex(str) {
  var result = "";
  for (let i=0; i<str.length; i++) {
    const hex = str.charCodeAt(i).toString(16);
    result += ("000"+hex).slice(-4);
  }
  return result
}

function unicodeHexToStr(str) {
  var hexChars = str.match(/.{1,4}/g) || [];
  var result = "";
  for(let j = 0; j<hexChars.length; j++) {
    result += String.fromCharCode(parseInt(hexChars[j], 16));
  }
  return result;
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
  sign: sign,
  verify: verify,
  reverify: reverify,
  hash: hash,
  hashFile: hashFile,
  HashIterator: HashIterator,
  errors: {
    APIError: APIError,
    BlockchainNotSupportedError: BlockchainNotSupportedError
  }
}


