
// Base Goerli

const ETHEREUM_MAINNET = {
  network: {
    chain: 1,
    name: "Ethereum",
    blockTime: 12000,
    providers: {
      http: ""
    }
  },
  contract: {
    address: "0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    creationBlock: 16764681
  }
}

const BASE_GOERLI = {
  network: {
    chain: 84531,
    name: "Base Goerli",
    blockTime: 2000
  },
  contract: {
    address: "0x0E06f4d4BC550A28aF7078ad20b3cB97C014973e",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    creationBlock: 1339864
  }
}

const ETHEREUM_SEPOLIA = {
  network: {
    chain: 11155111,
    name: "Sepolia",
    blockTime: 12000
  },
  contract: {
    address: "0xF6656646ECf7bD4100ec0014163F6CaD44eA1715",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    creationBlock: 3030122
  }
}

const POLYGON_MAINNET = {
  network: {
    chain: 137,
    name: "Polygon",
    blockTime: 2000
  },
  contract: {
    address: "0x4037E81D79aD0E917De012dE009ff41c740BB453",
    abi: [ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "signature", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "Signature", "type": "event" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" } ], "name": "isRegistered", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "sig_", "type": "bytes32" }, { "internalType": "bytes", "name": "data_", "type": "bytes" } ], "name": "registerSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ],
    creationBlock: 40031474
  },
  endpoint: {
    url: "https://polygon-mainnet.g.alchemy.com/v2/aLocFMVna57a6wIozAAwjggKEFvLfMcf"
  }
}

const BLOCKCHAINS = [
  ETHEREUM_MAINNET,
  POLYGON_MAINNET,
  BASE_GOERLI,
  ETHEREUM_SEPOLIA
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

