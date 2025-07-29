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

const POLYGON_MAINNET = new opensig.providers.HTTPProvider({
  chainId: 137,
  name: "Polygon",
  url: "https://polygon-mainnet.infura.io/v3/def9d47e2d744b90b2b68cf690db503a",
  contract: "0x4037E81D79aD0E917De012dE009ff41c740BB453",
  blockTime: 2000,
  creationBlock: 40031474,
  explorerUrl: "https://polygonscan.com/tx/"
})

/**
 * Supported blockchains
 */

const BLOCKCHAINS = [
  POLYGON_MAINNET,
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
