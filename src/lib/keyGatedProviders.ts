/**
 * Key-gated RPC providers — paid or account-required.
 *
 * These operate RPC services but every one of them requires either a
 * paid plan or at minimum an account sign-up before a request reaches
 * the chain. By RPC Watch's core measure (anonymous public access) they
 * do NOT reduce single-point-of-failure risk for an unauthenticated
 * wallet, so they are excluded from `distinctProviders`.
 *
 * They ARE listed per chain on the detail page so a reader can see
 * "sure, there's nothing anonymous, but here are the paid options if
 * you're a project building on this chain and want redundancy."
 *
 * Each entry is hand-curated with a citation URL so coverage can be
 * audited. Rough sources (checked 2026-04):
 *   - QuickNode:   https://www.quicknode.com/chains
 *   - Chainstack:  https://chainstack.com/protocols/
 *   - Alchemy:     https://www.alchemy.com/chain-connect
 *   - Infura:      https://docs.infura.io/networks
 *   - Ankr:        https://www.ankr.com/rpc/
 *   - Tatum:       https://tatum.io/chains
 *   - GetBlock:    https://getblock.io/nodes
 *   - NOWNodes:    https://nownodes.io/nodes
 *   - Helius:      https://www.helius.dev (Solana only)
 *   - Blockdaemon: https://www.blockdaemon.com/protocols
 *   - OnFinality:  https://onfinality.io (premium for many chains)
 *   - Syndica:     https://syndica.io (Solana only)
 *
 * The coverage list intentionally does NOT include every chain each
 * provider serves — only the ones we've confirmed via their public
 * docs page. Missing entries are honest gaps, not opinions. To add
 * coverage, cite the provider's own docs in a PR.
 */

import type { ProcessedChain } from './chains';

export type KeyGatedKind = 'paid' | 'signup-required';

export type KeyGatedProvider = {
  id: string;
  name: string;
  kind: KeyGatedKind;
  homepage: string;
  docs: string;
  /** Chain keys this provider serves. See chainKey() for format. */
  serves: string[];
};

/** Stable string identifier for a chain, used by the coverage matrix. */
export function chainKey(chain: ProcessedChain): string {
  if (chain.isNonEvm) return `nonevm:${chain.shortName}`;
  return `evm:${chain.chainId}`;
}

// Shorthand keys for common chains, used to keep provider entries readable.
const EVM = {
  ethereum: 'evm:1',
  optimism: 'evm:10',
  cronos: 'evm:25',
  bnb: 'evm:56',
  gnosis: 'evm:100',
  polygon: 'evm:137',
  sonic: 'evm:146',
  mantaPacific: 'evm:169',
  fantom: 'evm:250',
  boba: 'evm:288',
  zksync: 'evm:324',
  polygonZkevm: 'evm:1101',
  moonbeam: 'evm:1284',
  sei: 'evm:1329',
  mantle: 'evm:5000',
  base: 'evm:8453',
  arbitrum: 'evm:42161',
  celo: 'evm:42220',
  avalanche: 'evm:43114',
  linea: 'evm:59144',
  berachain: 'evm:80094',
  blast: 'evm:81457',
  taiko: 'evm:167000',
  scroll: 'evm:534352',
  zora: 'evm:7777777',
};

const NONEVM = {
  solana: 'nonevm:solana',
  sui: 'nonevm:sui',
  aptos: 'nonevm:aptos',
  near: 'nonevm:near',
  ton: 'nonevm:ton',
  tron: 'nonevm:tron',
  stacks: 'nonevm:stacks',
};

export const KEY_GATED_PROVIDERS: KeyGatedProvider[] = [
  {
    id: 'quicknode',
    name: 'QuickNode',
    kind: 'paid',
    homepage: 'https://www.quicknode.com',
    docs: 'https://www.quicknode.com/chains',
    serves: [
      EVM.ethereum, EVM.optimism, EVM.bnb, EVM.gnosis, EVM.polygon,
      EVM.fantom, EVM.zksync, EVM.polygonZkevm, EVM.base, EVM.arbitrum,
      EVM.celo, EVM.avalanche, EVM.linea, EVM.blast, EVM.scroll,
      EVM.moonbeam, EVM.sei, EVM.sonic, EVM.berachain, EVM.mantle,
      EVM.mantaPacific,
      NONEVM.solana, NONEVM.sui, NONEVM.aptos, NONEVM.near,
      NONEVM.ton, NONEVM.tron, NONEVM.stacks,
    ],
  },
  {
    id: 'chainstack',
    name: 'Chainstack',
    kind: 'paid',
    homepage: 'https://chainstack.com',
    docs: 'https://chainstack.com/protocols/',
    serves: [
      EVM.ethereum, EVM.optimism, EVM.bnb, EVM.polygon, EVM.fantom,
      EVM.zksync, EVM.base, EVM.arbitrum, EVM.avalanche, EVM.linea,
      EVM.blast, EVM.scroll, EVM.berachain, EVM.sei, EVM.mantle,
      EVM.gnosis,
      NONEVM.solana, NONEVM.sui, NONEVM.aptos, NONEVM.ton,
      NONEVM.tron, NONEVM.near,
    ],
  },
  {
    id: 'alchemy-paid',
    name: 'Alchemy',
    kind: 'paid',
    homepage: 'https://www.alchemy.com',
    docs: 'https://www.alchemy.com/chain-connect',
    serves: [
      EVM.ethereum, EVM.optimism, EVM.polygon, EVM.base, EVM.arbitrum,
      EVM.zksync, EVM.linea, EVM.blast, EVM.scroll, EVM.polygonZkevm,
      EVM.mantaPacific, EVM.berachain, EVM.sonic,
      NONEVM.solana,
    ],
  },
  {
    id: 'infura',
    name: 'Infura',
    kind: 'paid',
    homepage: 'https://www.infura.io',
    docs: 'https://docs.infura.io/networks',
    serves: [
      EVM.ethereum, EVM.polygon, EVM.arbitrum, EVM.optimism, EVM.base,
      EVM.linea, EVM.scroll, EVM.zksync, EVM.avalanche, EVM.bnb,
      EVM.mantaPacific, EVM.celo, EVM.blast,
    ],
  },
  {
    id: 'ankr-paid',
    name: 'Ankr (paid)',
    kind: 'paid',
    homepage: 'https://www.ankr.com',
    docs: 'https://www.ankr.com/rpc/',
    serves: [
      EVM.ethereum, EVM.optimism, EVM.bnb, EVM.polygon, EVM.fantom,
      EVM.base, EVM.arbitrum, EVM.avalanche, EVM.linea, EVM.blast,
      EVM.scroll, EVM.berachain, EVM.sei, EVM.sonic, EVM.mantle,
      EVM.celo, EVM.gnosis, EVM.moonbeam, EVM.zksync, EVM.polygonZkevm,
      EVM.taiko, EVM.zora,
      NONEVM.solana, NONEVM.sui, NONEVM.aptos, NONEVM.near,
      NONEVM.ton, NONEVM.tron,
    ],
  },
  {
    id: 'tatum',
    name: 'Tatum',
    kind: 'signup-required',
    homepage: 'https://tatum.io',
    docs: 'https://tatum.io/chains',
    serves: [
      EVM.ethereum, EVM.optimism, EVM.bnb, EVM.polygon, EVM.fantom,
      EVM.base, EVM.arbitrum, EVM.avalanche, EVM.celo, EVM.cronos,
      NONEVM.solana, NONEVM.ton, NONEVM.tron,
    ],
  },
  {
    id: 'getblock',
    name: 'GetBlock',
    kind: 'signup-required',
    homepage: 'https://getblock.io',
    docs: 'https://getblock.io/nodes',
    serves: [
      EVM.ethereum, EVM.bnb, EVM.polygon, EVM.fantom, EVM.avalanche,
      EVM.arbitrum, EVM.optimism, EVM.base, EVM.cronos,
      NONEVM.solana, NONEVM.ton, NONEVM.tron, NONEVM.near,
    ],
  },
  {
    id: 'nownodes',
    name: 'NOWNodes',
    kind: 'signup-required',
    homepage: 'https://nownodes.io',
    docs: 'https://nownodes.io/nodes',
    serves: [
      EVM.ethereum, EVM.bnb, EVM.polygon, EVM.fantom, EVM.avalanche,
      EVM.arbitrum, EVM.optimism,
      NONEVM.solana, NONEVM.ton, NONEVM.tron, NONEVM.near,
    ],
  },
  {
    id: 'helius-paid',
    name: 'Helius',
    kind: 'paid',
    homepage: 'https://www.helius.dev',
    docs: 'https://www.helius.dev',
    serves: [NONEVM.solana],
  },
  {
    id: 'syndica',
    name: 'Syndica',
    kind: 'paid',
    homepage: 'https://syndica.io',
    docs: 'https://syndica.io',
    serves: [NONEVM.solana],
  },
  {
    id: 'triton',
    name: 'Triton',
    kind: 'paid',
    homepage: 'https://triton.one',
    docs: 'https://triton.one',
    serves: [NONEVM.solana],
  },
  {
    id: 'blockdaemon',
    name: 'Blockdaemon',
    kind: 'paid',
    homepage: 'https://www.blockdaemon.com',
    docs: 'https://www.blockdaemon.com/protocols',
    serves: [
      EVM.ethereum, EVM.polygon, EVM.base, EVM.arbitrum, EVM.optimism,
      EVM.avalanche, EVM.bnb,
      NONEVM.solana, NONEVM.near, NONEVM.aptos, NONEVM.sui,
    ],
  },
  {
    id: 'onfinality-paid',
    name: 'OnFinality (premium)',
    kind: 'paid',
    homepage: 'https://onfinality.io',
    docs: 'https://onfinality.io',
    serves: [
      EVM.ethereum, EVM.polygon, EVM.bnb, EVM.base, EVM.arbitrum,
      EVM.optimism, EVM.moonbeam, EVM.avalanche,
      NONEVM.solana, NONEVM.near,
    ],
  },
  {
    id: 'moralis',
    name: 'Moralis',
    kind: 'paid',
    homepage: 'https://moralis.io',
    docs: 'https://docs.moralis.io/supported-chains',
    serves: [
      EVM.ethereum, EVM.bnb, EVM.polygon, EVM.fantom, EVM.avalanche,
      EVM.arbitrum, EVM.optimism, EVM.base, EVM.linea,
      NONEVM.solana,
    ],
  },
];

export function keyGatedProvidersFor(chain: ProcessedChain): KeyGatedProvider[] {
  const key = chainKey(chain);
  return KEY_GATED_PROVIDERS.filter((provider) => provider.serves.includes(key));
}
