/**
 * Curated list of notable chains that currently sit at 1-2 public RPC endpoints
 * in the live chainid.network dataset, making them especially worth highlighting.
 */
export const notableChains: Set<number> = new Set([
  238, // Blast Mainnet
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
  42220, // Celo Mainnet
  50104, // Sophon
  61166, // Treasure
  333999, // Polis Mainnet
  7777777, // Zora
]);

export function isNotableChain(chainId: number): boolean {
  return notableChains.has(chainId);
}
