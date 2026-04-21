/**
 * Key-gated RPC providers — paid or account-required.
 *
 * These operate RPC services but every one of them requires either a
 * paid plan or at minimum an account sign-up before a request reaches
 * the chain. Still counted toward a chain's total provider number
 * because they're real redundancy for any project willing to pay — the
 * chain row shows the breakdown as "N free · M paid" so the wallet-
 * level story stays visible.
 *
 * Each provider's `serves` list is hand-curated from that provider's
 * own published chain list (cited in the `docs` URL). When in doubt,
 * omit — under-crediting is safer than over-crediting. To add a chain
 * for a provider, cite the provider's own docs page in the PR.
 *
 * Sources last re-checked 2026-04:
 *   - QuickNode:   https://www.quicknode.com/chains
 *   - Chainstack:  https://chainstack.com/protocols/
 *   - Alchemy:     https://www.alchemy.com/chain-connect
 *   - Infura:      https://docs.infura.io/networks
 *   - Ankr:        https://www.ankr.com/rpc/
 *   - Tatum:       https://tatum.io/chains
 *   - GetBlock:    https://getblock.io/nodes
 *   - NOWNodes:    https://nownodes.io/nodes
 *   - Moralis:     https://docs.moralis.io/supported-chains
 *   - Blockdaemon: https://www.blockdaemon.com/protocols
 *   - OnFinality:  https://onfinality.io
 *   - Helius:      https://www.helius.dev (Solana only)
 *   - Syndica:     https://syndica.io (Solana only)
 *   - Triton:      https://triton.one (Solana only)
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

export function chainKey(chain: ProcessedChain): string {
  if (chain.isNonEvm) return `nonevm:${chain.shortName}`;
  return `evm:${chain.chainId}`;
}

// Shorthand for chain keys used by the coverage lists.
const EVM = {
  ethereum: 'evm:1',
  flare: 'evm:14',
  optimism: 'evm:10',
  cronos: 'evm:25',
  rootstock: 'evm:30',
  xLayer: 'evm:196',
  bnb: 'evm:56',
  gnosis: 'evm:100',
  unichain: 'evm:130',
  monad: 'evm:143',
  polygon: 'evm:137',
  sonic: 'evm:146',
  mantaPacific: 'evm:169',
  eniMainnet: 'evm:173',
  tac: 'evm:239',
  fantom: 'evm:250',
  fraxtal: 'evm:252',
  boba: 'evm:288',
  hedera: 'evm:295',
  filecoin: 'evm:314',
  zksync: 'evm:324',
  pulsechain: 'evm:369',
  cronosZkevm: 'evm:388',
  worldChain: 'evm:480',
  flowEvm: 'evm:747',
  rollux: 'evm:570',
  stable: 'evm:988',
  bifrost: 'evm:996',
  conflux: 'evm:1030',
  metis: 'evm:1088',
  injective: 'evm:1776',
  kava: 'evm:2222',
  algorand: 'evm:4160',
  polygonZkevm: 'evm:1101',
  moonbeam: 'evm:1284',
  sei: 'evm:1329',
  gravity: 'evm:1625',
  reya: 'evm:1729',
  soneium: 'evm:1868',
  ronin: 'evm:2020',
  abstract: 'evm:2741',
  movement: 'evm:3073',
  citrea: 'evm:4114',
  tempo: 'evm:4217',
  megaeth: 'evm:4326',
  mantle: 'evm:5000',
  nibiru: 'evm:6900',
  kaia: 'evm:8217',
  base: 'evm:8453',
  plasma: 'evm:9745',
  gateLayer: 'evm:10088',
  immutable: 'evm:13371',
  og: 'evm:16661',
  mezo: 'evm:31612',
  apechain: 'evm:33139',
  mode: 'evm:34443',
  arbitrum: 'evm:42161',
  celo: 'evm:42220',
  etherlink: 'evm:42793',
  hemi: 'evm:43111',
  avalanche: 'evm:43114',
  ink: 'evm:57073',
  linea: 'evm:59144',
  bob: 'evm:60808',
  berachain: 'evm:80094',
  blast: 'evm:81457',
  chiliz: 'evm:88888',
  plume: 'evm:98866',
  taiko: 'evm:167000',
  scroll: 'evm:534352',
  katana: 'evm:747474',
  tronEvm: 'evm:728126428',
  aurora: 'evm:1313161554',
  ethereal: 'evm:5064014',
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

// Shorthand groups used across providers.
const EVM_MAJORS = [
  EVM.ethereum, EVM.optimism, EVM.bnb, EVM.polygon, EVM.base, EVM.arbitrum,
  EVM.avalanche, EVM.linea, EVM.scroll, EVM.zksync, EVM.blast, EVM.polygonZkevm,
];

const NONEVM_ALL = Object.values(NONEVM);

export const KEY_GATED_PROVIDERS: KeyGatedProvider[] = [
  {
    id: 'quicknode',
    name: 'QuickNode',
    kind: 'paid',
    homepage: 'https://www.quicknode.com',
    docs: 'https://www.quicknode.com/chains',
    serves: [
      ...EVM_MAJORS,
      EVM.cronos, EVM.gnosis, EVM.unichain, EVM.sonic, EVM.mantaPacific,
      EVM.fantom, EVM.fraxtal, EVM.boba, EVM.celo, EVM.mantle, EVM.moonbeam,
      EVM.sei, EVM.mode, EVM.berachain, EVM.taiko, EVM.zora, EVM.apechain,
      EVM.immutable, EVM.ronin, EVM.kaia, EVM.worldChain, EVM.metis,
      EVM.soneium, EVM.abstract, EVM.filecoin, EVM.ink, EVM.aurora,
      EVM.flare, EVM.rootstock, EVM.xLayer, EVM.pulsechain, EVM.kava,
      EVM.algorand, EVM.hedera, EVM.plasma, EVM.movement, EVM.tronEvm,
      EVM.conflux, EVM.injective, EVM.bob, EVM.etherlink,
      ...NONEVM_ALL,
    ],
  },
  {
    id: 'chainstack',
    name: 'Chainstack',
    kind: 'paid',
    homepage: 'https://chainstack.com',
    docs: 'https://chainstack.com/protocols/',
    serves: [
      ...EVM_MAJORS,
      EVM.gnosis, EVM.fantom, EVM.berachain, EVM.sei, EVM.mantle, EVM.ronin,
      EVM.abstract, EVM.ink, EVM.unichain, EVM.kaia, EVM.metis,
      EVM.apechain, EVM.taiko, EVM.immutable, EVM.celo, EVM.flare,
      EVM.rootstock, EVM.xLayer, EVM.kava, EVM.hedera, EVM.tronEvm,
      EVM.injective, EVM.conflux,
      NONEVM.solana, NONEVM.sui, NONEVM.aptos, NONEVM.ton, NONEVM.tron, NONEVM.near,
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
      EVM.mantaPacific, EVM.berachain, EVM.sonic, EVM.mantle, EVM.gnosis,
      EVM.avalanche, EVM.bnb, EVM.celo, EVM.zora, EVM.soneium, EVM.abstract,
      EVM.ink, EVM.unichain, EVM.worldChain, EVM.apechain, EVM.monad,
      EVM.mode,
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
      EVM.mantaPacific, EVM.celo, EVM.blast, EVM.mantle, EVM.apechain,
      EVM.unichain, EVM.mode, EVM.metis, EVM.filecoin, EVM.soneium,
    ],
  },
  {
    id: 'ankr-paid',
    name: 'Ankr (paid)',
    kind: 'paid',
    homepage: 'https://www.ankr.com',
    docs: 'https://www.ankr.com/rpc/',
    serves: [
      ...EVM_MAJORS,
      EVM.fantom, EVM.berachain, EVM.sei, EVM.sonic, EVM.mantle,
      EVM.celo, EVM.gnosis, EVM.moonbeam, EVM.taiko, EVM.zora,
      EVM.cronos, EVM.apechain, EVM.kaia, EVM.unichain, EVM.ronin,
      EVM.filecoin, EVM.immutable, EVM.flowEvm, EVM.metis, EVM.mode,
      EVM.flare, EVM.rootstock, EVM.xLayer, EVM.pulsechain, EVM.kava,
      EVM.algorand, EVM.hedera, EVM.plasma, EVM.tronEvm, EVM.aurora,
      EVM.conflux, EVM.injective, EVM.bob, EVM.rollux, EVM.etherlink,
      ...NONEVM_ALL,
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
      EVM.kaia, EVM.flowEvm, EVM.chiliz, EVM.gnosis, EVM.rootstock,
      EVM.algorand, EVM.hedera, EVM.tronEvm,
      NONEVM.solana, NONEVM.ton, NONEVM.tron, NONEVM.stacks,
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
      EVM.arbitrum, EVM.optimism, EVM.base, EVM.cronos, EVM.gnosis,
      EVM.filecoin, EVM.kaia, EVM.moonbeam, EVM.rootstock, EVM.algorand,
      EVM.tronEvm,
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
      EVM.arbitrum, EVM.optimism, EVM.base, EVM.gnosis, EVM.cronos,
      EVM.algorand, EVM.tronEvm,
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
      EVM.avalanche, EVM.bnb, EVM.fantom, EVM.celo, EVM.gnosis,
      EVM.moonbeam, EVM.kaia, EVM.filecoin,
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
      EVM.optimism, EVM.moonbeam, EVM.avalanche, EVM.apechain,
      EVM.abstract,
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
      EVM.arbitrum, EVM.optimism, EVM.base, EVM.linea, EVM.ronin,
      NONEVM.solana,
    ],
  },
];

export function keyGatedProvidersFor(chain: ProcessedChain): KeyGatedProvider[] {
  const key = chainKey(chain);
  return KEY_GATED_PROVIDERS.filter((provider) => provider.serves.includes(key));
}
