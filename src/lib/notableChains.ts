/**
 * Curated list of notable chains. These appear first in sorted results
 * regardless of risk level, so users recognise the names at the top.
 */
export const notableChains: Set<number> = new Set([
  // Majors
  1, // Ethereum Mainnet
  10, // OP Mainnet
  25, // Cronos Mainnet
  56, // BNB Smart Chain
  100, // Gnosis
  137, // Polygon Mainnet
  146, // Sonic Mainnet
  169, // Manta Pacific
  250, // Fantom Opera
  288, // Boba Network
  324, // zkSync Mainnet
  1101, // Polygon zkEVM
  1284, // Moonbeam
  1329, // Sei Network
  5000, // Mantle
  8453, // Base
  42161, // Arbitrum One
  42220, // Celo Mainnet
  43114, // Avalanche C-Chain
  59144, // Linea
  80094, // Berachain
  81457, // Blast
  167000, // Taiko Alethia
  534352, // Scroll
  7777777, // Zora
  // Curated smaller projects
  238, // Blast Mainnet (legacy id)
  291, // Orderly Mainnet
  478, // Form Network
  1612, // OpenLedger Mainnet
  2741, // Abstract
  4114, // Citrea Mainnet
  4613, // VERY Mainnet
  5330, // Superseed
  8333, // B3
  16661, // 0G Mainnet
  29548, // MCH Verse Mainnet
  33139, // ApeChain
  50104, // Sophon
  61166, // Treasure
  333999, // Polis Mainnet
]);

export function isNotableChain(chainId: number): boolean {
  return notableChains.has(chainId);
}
