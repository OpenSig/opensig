
// Base Goerli

const BASE_GOERLI = {

  network: {
    chain: 84531,
    name: "Base Goerli"
  },

  contract: {
    address: "0x0E06f4d4BC550A28aF7078ad20b3cB97C014973e",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ]
  },

  api: {
    endpoint: "https://divine-green-orb.base-goerli.discover.quiknode.pro/f886a37aca7a8de5ac712cafe870639d9efe36e1/",
    maxTopics: 3,
    requests: {

      getSignatures: (signatures) => {
        var headers = new Headers();
        headers.append("Content-Type", "application/json");
        const topics = [null, null, signatures]; //signatures.map(s => { return [null, null, s] });
        console.log("topics", topics)
        return {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            method: 'eth_getLogs',
            params: [{
              fromBlock: 'earliest',
              address: "0x0E06f4d4BC550A28aF7078ad20b3cB97C014973e",
              topics: topics 
            }],
            id: 1,
            jsonrpc: '2.0'
          }),
          redirect: "follow"
        }
      }

    },

    encoders: {

      decodeSignatureEvent: (event, dataDecoder) => {
        const web3 = new Web3(window.ethereum);
        const decodedEvent = web3.eth.abi.decodeLog(
          [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ],
          event.data,
          event.topics.slice(1)
        )
        return {
          time: decodedEvent.time,
          signatory: decodedEvent.signer,
          signature: decodedEvent.signature,
          data: dataDecoder(decodedEvent.data)
        }
      }

    }
  }

}


const BLOCKCHAINS = [
  BASE_GOERLI
]

function getBlockchain(chainId=window.ethereum.networkVersion) {
  for (i=0; i<BLOCKCHAINS.length; i++) {
    if (BLOCKCHAINS[i].network.chain == chainId) return BLOCKCHAINS[i];
  }
  return undefined;
}

function blockchainSupported(chainId) {
  return getBlockchain(chainId) !== undefined;
}

