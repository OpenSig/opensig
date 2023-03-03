
// Base Goerli

const BASE_GOERLI = {

  network: {
    chain: 84531,
    name: "Base Goerli"
  },

  contract: {
    address: "0x0E06f4d4BC550A28aF7078ad20b3cB97C014973e",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes32", "name": "data", "type": "bytes32" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes32", "name": "data_", "type": "bytes32" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ]
  },

  api: {
    endpoint: "https://divine-green-orb.base-goerli.discover.quiknode.pro/f886a37aca7a8de5ac712cafe870639d9efe36e1/",
    maxTopics: 3,
    requests: {

      getSignatures: (signatures) => {
        var headers = new Headers();
        headers.append("Content-Type", "application/json");
        const topics = signatures.map(s => { return [null, null, s, null] });
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

