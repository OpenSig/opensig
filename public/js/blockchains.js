// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * blockchains.js
 * 
 * Configuration for blockchains supported by the core OpenSig library.
 * 
 * Use getBlockchain() to obtain the blockchain configuration object for the chain currently
 * selected in Metamask, or use getBlockchain(<chainId>) for a specific chain.
 * 
 * Requires Metamask.
 */


//
// Blockchains
//

const ETHEREUM_MAINNET = new opensig.providers.MetamaskProvider({
  chainId: 1,
  name: "Ethereum",
  contract: "0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30", 
  blockTime: 12000,
  creationBlock: 16764681,
  explorerUrl: "https://etherscan.io/tx/"
})

const POLYGON_MAINNET = new opensig.providers.HTTPProvider({
  chainId: 137,
  name: "Polygon",
  url: "https://polygon-mainnet.g.alchemy.com/v2/aLocFMVna57a6wIozAAwjggKEFvLfMcf",
  contract: "0x4037E81D79aD0E917De012dE009ff41c740BB453",
  blockTime: 2000,
  creationBlock: 40031474,
  explorerUrl: "https://polygonscan.com/tx/"
})

const BINANCE_SMART_CHAIN = new opensig.providers.AnkrProvider({
  chainId: 56,
  name: "Binance Smart Chain",
  endpoint: "https://rpc.ankr.com/multichain/dc0a9a8ba24082d31cbd793eb170eb9260148e6c8cd62ed7434b358608891eee",
  blockchain: 'bsc',
  contract: "0xF6656646ECf7bD4100ec0014163F6CaD44eA1715",
  creationBlock: 26229027,
  blockTime: 3000,
  networkLatency: 5000,
  explorerUrl: "https://bscscan.com/tx/"
})

const AVALANCHE = new opensig.providers.AnkrProvider({
  chainId: 43114,
  name: "Avalanche",
  endpoint: "https://rpc.ankr.com/multichain/dc0a9a8ba24082d31cbd793eb170eb9260148e6c8cd62ed7434b358608891eee",
  blockchain: 'avalanche',
  contract: "0xF6656646ECf7bD4100ec0014163F6CaD44eA1715",
  creationBlock: 27645459,
  blockTime: 2000,
  networkLatency: 5000,
  explorerUrl: "https://snowtrace.io/tx/"
})

const BASE = new opensig.providers.AnkrProvider({
  chainId: 8453,
  name: "Base Mainnet",
  endpoint: "https://rpc.ankr.com/multichain/dc0a9a8ba24082d31cbd793eb170eb9260148e6c8cd62ed7434b358608891eee",
  contract: "0xC9bf7c7242EA0fc13698Adf585f06A8F441C9155",
  blockTime: 2000,
  creationBlock: 27537843,
  explorerUrl: "https://basescan.org/tx/"
})

const ETHEREUM_SEPOLIA = new opensig.providers.AnkrProvider({
  chainId: 11155111,
  name: "Sepolia",
  endpoint: "https://rpc.ankr.com/multichain/dc0a9a8ba24082d31cbd793eb170eb9260148e6c8cd62ed7434b358608891eee",
  blockchain: 'eth_sepolia',
  contract: "0xF6656646ECf7bD4100ec0014163F6CaD44eA1715",
  blockTime: 12000,
  creationBlock: 3030122,
  explorerUrl: "https://sepolia.etherscan.io/tx/",
  networkLatency: 5000
})

const XRPL_EVM_DEVNET = new opensig.providers.MetamaskProvider({
  chainId: 1440002,
  name: "XRPL EVM Devnet",
  contract: "0xB6FCE33A84253037A7Fac6291929D2488973Ff38",
  blockTime: 3500,
  creationBlock: 15078501,
  explorerUrl: "https://explorer.xrplevm.org/tx/"
})


/**
 * Supported blockchains
 */

const BLOCKCHAINS = [
  ETHEREUM_MAINNET,
  POLYGON_MAINNET,
  BINANCE_SMART_CHAIN,
  AVALANCHE,
  BASE,
  XRPL_EVM_DEVNET,
  ETHEREUM_SEPOLIA
]


/**
 * Returns the BLOCKCHAINS element that represents the given chainId.  If chainId is not given
 * then it retrieves the chainId from Metamask.  Returns undefined if the chain is not supported.
 */
function getBlockchain(chainId = window.ethereum.chainId) {
  if (typeof chainId === 'string' && chainId.startsWith('0x')) {
    chainId = parseInt(chainId, 16);
  } else if (typeof chainId === 'string') {
    chainId = parseInt(chainId, 10);
  }
  for (let i = 0; i < BLOCKCHAINS.length; i++) {
    if (BLOCKCHAINS[i].chainId === chainId) return BLOCKCHAINS[i];
  }
  return undefined;
}

/**
 * Returns true if the given chainId is found in the supported BLOCKCHAINS list.
 */
function blockchainSupported(chainId) {
  return getBlockchain(chainId) !== undefined;
}
