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
  130, // Unichain
  137, // Polygon Mainnet
  143, // Monad
  146, // Sonic Mainnet
  169, // Manta Pacific
  239, // TAC
  250, // Fantom Opera
  288, // Boba Network
  324, // zkSync Mainnet
  480, // World Chain
  988, // Stable
  999, // HyperEVM (Hyperliquid)
  1101, // Polygon zkEVM
  1284, // Moonbeam
  1329, // Sei Network
  1514, // Story / Data Network
  1868, // Soneium
  4217, // Tempo
  4326, // MegaETH
  5000, // Mantle
  8453, // Base
  9745, // Plasma
  42161, // Arbitrum One
  42220, // Celo Mainnet
  43111, // Hemi
  43114, // Avalanche C-Chain
  57073, // Ink
  59144, // Linea
  80094, // Berachain
  81457, // Blast
  98866, // Plume
  167000, // Taiko Alethia
  534352, // Scroll
  747474, // Katana
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
  // LayerZero-connected names people actually recognise
  14, // Flare
  30, // Rootstock
  196, // OKX X Layer
  204, // opBNB
  252, // Fraxtal
  747, // Flow EVM
  1030, // Conflux eSpace
  1088, // Metis
  1116, // Core
  1135, // Lisk
  1625, // Gravity
  1729, // Reya
  1776, // Injective EVM
  2818, // Morph
  34443, // Mode
  4153, // RISE
  4200, // Merlin
  42793, // Etherlink
  4663, // Robinhood Chain
  5031, // Somnia
  60808, // BOB
  6714, // ANUBIS
  8217, // Kaia
  10088, // Gate Layer
  1313161554, // Aurora
  5064014, // Ethereal (Ethena)
]);

export function isNotableChain(chainId: number): boolean {
  return notableChains.has(chainId);
}
