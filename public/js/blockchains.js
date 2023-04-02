
//
// Providers
//

/**
 * Returns a promise to resolve with the receipt when the given transaction hash has been confirmed by the blockchain network.
 * Rejects if the transaction reverted.
 * If the networkLatency parameter has been given then it includes that delay before resolving.  This is useful when different
 * RPC nodes are used for publishing and querying.  Gives time for the transaction to spread through the network.
 */
function awaitTransactionConfirmation(txHash, web3, networkLatency=0) {
  return new Promise( (resolve, reject) => {

    function checkTxReceipt(txHash, interval, resolve, reject) {
      console.debug('checkTxReceipt:', txHash, interval)
      web3.eth.getTransactionReceipt(txHash)
        .then(receipt => {
          if (receipt === null ) setTimeout(() => { checkTxReceipt(txHash, interval, resolve, reject) }, interval);
          else {
            if (receipt.status) networkLatency > 0 ? setTimeout(() => resolve(receipt), networkLatency) : resolve(receipt);
            else reject(receipt);
          }
        })
    }
    
    setTimeout(() => { checkTxReceipt(txHash, 1000, resolve, reject) }, this.blockTime); 
  })
}


class Provider {

  constructor(params) { 
    this.contract = params.contract;
    this.fromBlock = params.creationBlock;
    this.abi = params.abi;
    this.blockTime = params.blockTime;
    this.networkLatency = params.networkLatency;
  }

  publishSignature(signatory, signature, data) {
    const web3 = this._getWeb3();
    const contract = new web3.eth.Contract(this.abi, this.contract);
    const transactionParameters = {
      to: this.contract,
      from: signatory,
      value: 0,
      data: contract.methods.registerSignature(signature, data).encodeABI()
    };
    return window.ethereum.request({ method: 'eth_sendTransaction', params: [transactionParameters] })
      .then(txHash => { 
        return { 
          txHash: txHash, 
          signatory: signatory,
          signature: signature,
          confirmationInformer: awaitTransactionConfirmation(txHash, web3, this.networkLatency) 
        };
      });
  }

  getSelectedAddress() {
    return window.ethereum.selectedAddress;
  }

  _getWeb3() {
    return new Web3(window.ethereum);
  }

}

class MetamaskProvider extends Provider{

  querySignatures(ids) {
    const web3 = this._getWeb3();
    return web3.eth.getPastLogs({
      address: this.contract,
      fromBlock: this.fromBlock,
      topics: [null, null, ids]
    });
  }
  
}

class HTTPProvider extends MetamaskProvider {

  constructor(params) {
    super(params);
    this.url = params.url;
  }

  _getWeb3() {
    return new Web3(new Web3.providers.HttpProvider(this.url));
  }

}

class AnkrProvider extends Provider {

  constructor(params) {
    super(params);
    this.endpoint = params.endpoint;
  }

  querySignatures(ids) {
    return fetch( this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "ankr_getLogs",
        params: {
          blockchain: this.blockchain,
          address: this.contract,
          fromBlock: this.fromBlock,
          topics: [null, null, ids]
        }
      })
    })
    .then(response => {
      console.debug("fetch response:", response)
      if (response.status !== 200) throw new Error(response.status+": "+response.statusText);
      return response.json();
    })
    .then(response => {
      console.debug("ankr response:", response)
      if (response.error && response.error.code) throw new Error(response.error.code+': '+response.error.message);
      if (!response.result || !response.result.logs) {
        console.error('Failed to query signatures at '+this.endpoint+': missing result logs in Ankr response');
        return [];
      }
      return response.result.logs;
    })
  }

}


//
// Blockchains
//

const ETHEREUM_MAINNET = {
  chain: 1,
  name: "Ethereum",
  provider: new MetamaskProvider({
    contract: "0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30", 
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    blockTime: 12000,
    creationBlock: 16764681
  })
}

const BASE_GOERLI = {
  chain: 84531,
  name: "Base Goerli",
  provider: new MetamaskProvider({
    contract: "0x0E06f4d4BC550A28aF7078ad20b3cB97C014973e",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    blockTime: 2000,
    creationBlock: 1339864
  })
}

const ETHEREUM_SEPOLIA = {
  chain: 11155111,
  name: "Sepolia",
  provider: new MetamaskProvider({
    contract: "0xF6656646ECf7bD4100ec0014163F6CaD44eA1715",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    blockTime: 12000,
    creationBlock: 3030122
  })
}

const POLYGON_MAINNET = {
  chain: 137,
  name: "Polygon",
  provider: new HTTPProvider({
    url: "https://polygon-mainnet.g.alchemy.com/v2/aLocFMVna57a6wIozAAwjggKEFvLfMcf",
    contract: "0x4037E81D79aD0E917De012dE009ff41c740BB453",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    blockTime: 2000,
    creationBlock: 40031474
  })
}

const BINANCE_SMART_CHAIN = {
  chain: 56,
  name: "Binance Smart Chain",
  provider: new AnkrProvider({
    endpoint: "https://rpc.ankr.com/multichain",
    blockchain: 'bsc',
    contract: "0xF6656646ECf7bD4100ec0014163F6CaD44eA1715",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    creationBlock: 26229027,
    blockTime: 3000,
    networkLatency: 5000
  })
}

const AVALANCHE = {
  chain: 43114,
  name: "Avalanche",
  provider: new AnkrProvider({
    endpoint: "https://rpc.ankr.com/multichain",
    blockchain: 'avalanche',
    contract: "0xF6656646ECf7bD4100ec0014163F6CaD44eA1715",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    creationBlock: 27645459,
    blockTime: 2000,
    networkLatency: 5000
  })
}


const BLOCKCHAINS = [
  ETHEREUM_MAINNET,
  POLYGON_MAINNET,
  BINANCE_SMART_CHAIN,
  AVALANCHE,
  BASE_GOERLI,
  ETHEREUM_SEPOLIA
]

function getBlockchain(chainId=window.ethereum.networkVersion) {
  console.debug('get chain:', chainId)
  for (i=0; i<BLOCKCHAINS.length; i++) {
    if (BLOCKCHAINS[i].chain == chainId) return BLOCKCHAINS[i];
  }
  return undefined;
}

function blockchainSupported(chainId) {
  return getBlockchain(chainId) !== undefined;
}
