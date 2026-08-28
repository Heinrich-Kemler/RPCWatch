/**
 * Hand-curated hostname → provider map.
 *
 * Many public RPC lists stack multiple URLs that all resolve to the same
 * operator (dRPC, PublicNode, Ankr, Conduit, Caldera, …). Counting URLs
 * as independent providers over-states redundancy. This map collapses
 * URLs to their real operator so `distinctProviders` reflects actual
 * infrastructure diversity.
 *
 * Matching logic (`identifyProvider`):
 *   1. try exact apex match (last two hostname labels)
 *   2. try a small set of subdomain-specific overrides
 *   3. fall back to the apex itself as a synthetic provider id
 *
 * When the provider is unknown we return the apex as the identity — two
 * URLs on the same unknown apex still count as one provider, two URLs on
 * different unknown apexes count as two.
 */

type ProviderDef = {
  /** Short human label shown in the UI. */
  name: string;
  /** Stable id used for equality (grouping RPCs). */
  id: string;
  /** Short category. */
  kind: 'public-rpc-aggregator' | 'rollup-infra' | 'appchain-infra' | 'foundation' | 'other';
};

/**
 * Keyed by apex hostname (last two labels, lower-case).
 */
const APEX_PROVIDERS: Record<string, ProviderDef> = {
  // Public multi-chain aggregators — large consolidation risk.
  'drpc.org': { name: 'dRPC', id: 'drpc', kind: 'public-rpc-aggregator' },
  'publicnode.com': { name: 'PublicNode', id: 'publicnode', kind: 'public-rpc-aggregator' },
  'ankr.com': { name: 'Ankr', id: 'ankr', kind: 'public-rpc-aggregator' },
  '1rpc.io': { name: '1RPC', id: '1rpc', kind: 'public-rpc-aggregator' },
  'blastapi.io': { name: 'Blast API', id: 'blastapi', kind: 'public-rpc-aggregator' },
  'blockpi.network': { name: 'BlockPI', id: 'blockpi', kind: 'public-rpc-aggregator' },
  'tenderly.co': { name: 'Tenderly', id: 'tenderly', kind: 'public-rpc-aggregator' },
  'onfinality.io': { name: 'OnFinality', id: 'onfinality', kind: 'public-rpc-aggregator' },
  'omniatech.io': { name: 'Omnia', id: 'omnia', kind: 'public-rpc-aggregator' },
  'tatum.io': { name: 'Tatum', id: 'tatum', kind: 'public-rpc-aggregator' },
  'pocket.network': { name: 'Pocket Network', id: 'pocket', kind: 'public-rpc-aggregator' },
  'dwellir.com': { name: 'Dwellir', id: 'dwellir', kind: 'public-rpc-aggregator' },
  'therpc.io': { name: 'TheRPC', id: 'therpc', kind: 'public-rpc-aggregator' },
  'nodies.app': { name: 'Nodies DLB', id: 'nodies', kind: 'public-rpc-aggregator' },
  '4everland.org': { name: '4EVERLAND', id: '4everland', kind: 'public-rpc-aggregator' },
  'zan.top': { name: 'ZAN', id: 'zan', kind: 'public-rpc-aggregator' },
  'gateway.fm': { name: 'Gateway.fm', id: 'gateway.fm', kind: 'public-rpc-aggregator' },
  'llamarpc.com': { name: 'LlamaNodes', id: 'llamanodes', kind: 'public-rpc-aggregator' },
  'sentio.xyz': { name: 'Sentio', id: 'sentio', kind: 'public-rpc-aggregator' },
  'moralis.io': { name: 'Moralis', id: 'moralis', kind: 'public-rpc-aggregator' },
  'chainstacklabs.com': { name: 'Chainstack', id: 'chainstack', kind: 'public-rpc-aggregator' },
  'chainstack.com': { name: 'Chainstack', id: 'chainstack', kind: 'public-rpc-aggregator' },
  'infura.io': { name: 'Infura', id: 'infura', kind: 'public-rpc-aggregator' },
  'alchemy.com': { name: 'Alchemy', id: 'alchemy', kind: 'public-rpc-aggregator' },
  'alchemyapi.io': { name: 'Alchemy', id: 'alchemy', kind: 'public-rpc-aggregator' },
  'quiknode.pro': { name: 'QuickNode', id: 'quicknode', kind: 'public-rpc-aggregator' },
  'thirdweb.com': { name: 'thirdweb', id: 'thirdweb', kind: 'public-rpc-aggregator' },
  'leorpc.com': { name: 'LeoRPC', id: 'leorpc', kind: 'public-rpc-aggregator' },
  'nownodes.io': { name: 'NOWNodes', id: 'nownodes', kind: 'public-rpc-aggregator' },
  'getblock.io': { name: 'GetBlock', id: 'getblock', kind: 'public-rpc-aggregator' },
  'lavanet.xyz': { name: 'Lava Network', id: 'lava', kind: 'public-rpc-aggregator' },
  'subquery.network': { name: 'SubQuery', id: 'subquery', kind: 'public-rpc-aggregator' },
  'helium.io': { name: 'Helium', id: 'helium', kind: 'public-rpc-aggregator' },
  'owlracle.info': { name: 'Owlracle', id: 'owlracle', kind: 'public-rpc-aggregator' },
  'meowrpc.com': { name: 'MeowRPC', id: 'meowrpc', kind: 'public-rpc-aggregator' },
  'blxrbdn.com': { name: 'bloXroute', id: 'bloxroute', kind: 'public-rpc-aggregator' },
  'stakely.io': { name: 'Stakely', id: 'stakely', kind: 'public-rpc-aggregator' },
  'callstaticrpc.com': { name: 'CallStaticRPC', id: 'callstaticrpc', kind: 'public-rpc-aggregator' },
  'stackup.sh': { name: 'Stackup', id: 'stackup', kind: 'public-rpc-aggregator' },
  'fastnode.io': { name: 'FastNode', id: 'fastnode', kind: 'public-rpc-aggregator' },
  'histori.xyz': { name: 'Histori', id: 'histori', kind: 'public-rpc-aggregator' },
  'radiumblock.co': { name: 'RadiumBlock', id: 'radiumblock', kind: 'public-rpc-aggregator' },
  'unifra.io': { name: 'Unifra', id: 'unifra', kind: 'public-rpc-aggregator' },
  'rpcfast.com': { name: 'RPCFast', id: 'rpcfast', kind: 'public-rpc-aggregator' },
  'lava.build': { name: 'Lava Network', id: 'lava', kind: 'public-rpc-aggregator' },
  'helius-rpc.com': { name: 'Helius', id: 'helius', kind: 'public-rpc-aggregator' },
  'tonhubapi.com': { name: 'TonHub', id: 'tonhub', kind: 'foundation' },
  'tonapi.io': { name: 'TonAPI', id: 'tonapi', kind: 'foundation' },
  'blockeden.xyz': { name: 'BlockEden', id: 'blockeden', kind: 'public-rpc-aggregator' },
  // Non-EVM ecosystem operators
  'nodely.dev': { name: 'Nodely', id: 'nodely', kind: 'public-rpc-aggregator' },
  'nodely.io': { name: 'Nodely', id: 'nodely', kind: 'public-rpc-aggregator' },
  'algonode.cloud': { name: 'Nodely (algonode)', id: 'nodely', kind: 'public-rpc-aggregator' },
  'koios.rest': { name: 'Koios', id: 'koios', kind: 'public-rpc-aggregator' },
  'mithril.network': { name: 'Mithril (IOG)', id: 'mithril', kind: 'foundation' },
  'numia.xyz': { name: 'Numia', id: 'numia', kind: 'public-rpc-aggregator' },
  'pops.one': { name: 'P-OPS', id: 'pops', kind: 'public-rpc-aggregator' },
  'blockchair.com': { name: 'Blockchair', id: 'blockchair', kind: 'public-rpc-aggregator' },
  'blockstream.info': { name: 'Blockstream Esplora', id: 'blockstream', kind: 'public-rpc-aggregator' },
  'mempool.space': { name: 'Mempool.space', id: 'mempool', kind: 'public-rpc-aggregator' },
  'blockchain.info': { name: 'Blockchain.com', id: 'blockchain-com', kind: 'public-rpc-aggregator' },
  'blockcypher.com': { name: 'BlockCypher', id: 'blockcypher', kind: 'public-rpc-aggregator' },
  'btcscan.org': { name: 'BTCScan', id: 'btcscan', kind: 'public-rpc-aggregator' },
  'litecoinspace.org': { name: 'Litecoin Space', id: 'litecoinspace', kind: 'public-rpc-aggregator' },
  'polkachu.com': { name: 'Polkachu', id: 'polkachu', kind: 'public-rpc-aggregator' },
  'ibp.network': { name: 'IBP Network', id: 'ibp', kind: 'public-rpc-aggregator' },
  'xrplcluster.com': { name: 'XRPL Cluster', id: 'xrplcluster', kind: 'public-rpc-aggregator' },
  'ripple.com': { name: 'Ripple', id: 'ripple', kind: 'foundation' },
  'orbs.network': { name: 'Orbs TON Access', id: 'orbs', kind: 'public-rpc-aggregator' },
  'nodeflare.app': { name: 'Nodeflare', id: 'nodeflare', kind: 'public-rpc-aggregator' },
  'routeme.sh': { name: 'RouteMe', id: 'routeme', kind: 'public-rpc-aggregator' },
  'swiftnodes.io': { name: 'SwiftNodes', id: 'swiftnodes', kind: 'public-rpc-aggregator' },
  'huginn.tech': { name: 'Huginn', id: 'huginn', kind: 'public-rpc-aggregator' },
  'originstake.com': { name: 'OriginStake', id: 'originstake', kind: 'public-rpc-aggregator' },
  'spidernode.net': { name: 'SpiderNode', id: 'spidernode', kind: 'public-rpc-aggregator' },
  'goldsky.com': { name: 'Goldsky', id: 'goldsky', kind: 'public-rpc-aggregator' },
  'story-rpc.com': { name: 'Ankr', id: 'ankr', kind: 'public-rpc-aggregator' },
  // Chain-native / foundation endpoints
  'onflow.org': { name: 'Dapper Labs', id: 'dapper', kind: 'foundation' },
  'ic0.app': { name: 'DFINITY', id: 'dfinity', kind: 'foundation' },
  'sei-apis.com': { name: 'Sei Foundation', id: 'sei-foundation', kind: 'foundation' },
  'injective.network': { name: 'Injective Foundation', id: 'injective-foundation', kind: 'foundation' },
  'movementnetwork.xyz': { name: 'Movement Labs', id: 'movement-labs', kind: 'foundation' },
  'shardeum.org': { name: 'Shardeum Foundation', id: 'shardeum-foundation', kind: 'foundation' },
  'hashio.io': { name: 'Hashio', id: 'hashio', kind: 'public-rpc-aggregator' },
  'vechain.org': { name: 'VeChain Foundation', id: 'vechain-foundation', kind: 'foundation' },
  'vechain.energy': { name: 'VeChain Energy (community)', id: 'vechain-energy', kind: 'other' },
  'veblocks.net': { name: 'VeBlocks', id: 'veblocks', kind: 'public-rpc-aggregator' },
  'hyperliquid.xyz': { name: 'Hyperliquid Foundation', id: 'hyperliquid-foundation', kind: 'foundation' },
  'hypurrscan.io': { name: 'Hypurrscan', id: 'hypurrscan', kind: 'other' },
  'hyperlend.finance': { name: 'HyperLend', id: 'hyperlend', kind: 'other' },
  'megaeth.com': { name: 'MegaETH Foundation', id: 'megaeth-foundation', kind: 'foundation' },
  'unichain.org': { name: 'Uniswap Labs', id: 'uniswap-labs', kind: 'foundation' },
  'soneium.org': { name: 'Soneium', id: 'soneium-foundation', kind: 'foundation' },
  'inkonchain.com': { name: 'Ink', id: 'ink-foundation', kind: 'foundation' },
  'storyrpc.io': { name: 'Story Foundation', id: 'story-foundation', kind: 'foundation' },
  'datarpc.io': { name: 'Story Foundation', id: 'story-foundation', kind: 'foundation' },
  'nibiru.fi': { name: 'Nibiru Foundation', id: 'nibiru-foundation', kind: 'foundation' },
  'apechain.com': { name: 'ApeChain', id: 'apechain-foundation', kind: 'foundation' },
  'abs.xyz': { name: 'Abstract', id: 'abstract-foundation', kind: 'foundation' },
  'sophon.xyz': { name: 'Sophon', id: 'sophon-foundation', kind: 'foundation' },
  'plasma.to': { name: 'Plasma Foundation', id: 'plasma-foundation', kind: 'foundation' },
  'stable.xyz': { name: 'Stable Foundation', id: 'stable-foundation', kind: 'foundation' },
  'tempo.xyz': { name: 'Tempo Foundation', id: 'tempo-foundation', kind: 'foundation' },
  'tac.build': { name: 'TAC Foundation', id: 'tac-foundation', kind: 'foundation' },
  'monadinfra.com': { name: 'Monad Foundation', id: 'monad-foundation', kind: 'foundation' },
  'monad.xyz': { name: 'Monad Foundation', id: 'monad-foundation', kind: 'foundation' },

  // Rollup-as-a-service — every rollup they host shares this infra.
  'conduit.xyz': { name: 'Conduit', id: 'conduit', kind: 'rollup-infra' },
  'caldera.xyz': { name: 'Caldera', id: 'caldera', kind: 'rollup-infra' },
  'calderachain.xyz': { name: 'Caldera', id: 'caldera', kind: 'rollup-infra' },
  'alt.technology': { name: 'AltLayer', id: 'altlayer', kind: 'rollup-infra' },
  'gelato.digital': { name: 'Gelato', id: 'gelato', kind: 'rollup-infra' },
  'gelato.cloud': { name: 'Gelato', id: 'gelato', kind: 'rollup-infra' },
  'ankr.network': { name: 'Ankr', id: 'ankr', kind: 'public-rpc-aggregator' },

  // Appchain / ecosystem infra.
  'skalenodes.com': { name: 'SKALE', id: 'skale', kind: 'appchain-infra' },
  'avax.network': { name: 'Avalanche Foundation', id: 'avax', kind: 'foundation' },

  // Major foundations for non-EVM chains (used by the seed table).
  'solana.com': { name: 'Solana Foundation', id: 'solana-foundation', kind: 'foundation' },
  'sui.io': { name: 'Mysten Labs', id: 'mysten-labs', kind: 'foundation' },
  'aptoslabs.com': { name: 'Aptos Foundation', id: 'aptos-foundation', kind: 'foundation' },
  'near.org': { name: 'Near Foundation', id: 'near-foundation', kind: 'foundation' },
  'toncenter.com': { name: 'TON Foundation', id: 'ton-foundation', kind: 'foundation' },
  'trongrid.io': { name: 'TronGrid', id: 'trongrid', kind: 'foundation' },
  'hiro.so': { name: 'Hiro Systems', id: 'hiro', kind: 'foundation' },

  // Official / foundation endpoints that LayerZero and wallets actually use.
  // Counting these as their own operator stops "3 URLs on the same branded
  // domain" from looking like three independent providers — and stops a
  // chain's official RPC being lumped into a generic unknown apex.
  'base.org': { name: 'Base Foundation', id: 'base-foundation', kind: 'foundation' },
  'optimism.io': { name: 'Optimism Foundation', id: 'op-foundation', kind: 'foundation' },
  'arbitrum.io': { name: 'Arbitrum Foundation', id: 'arb-foundation', kind: 'foundation' },
  'blast.io': { name: 'Blast Foundation', id: 'blast-foundation', kind: 'foundation' },
  'linea.build': { name: 'Linea', id: 'linea-foundation', kind: 'foundation' },
  'scroll.io': { name: 'Scroll Foundation', id: 'scroll-foundation', kind: 'foundation' },
  'zksync.io': { name: 'Matter Labs', id: 'matter-labs', kind: 'foundation' },
  'mantle.xyz': { name: 'Mantle Foundation', id: 'mantle-foundation', kind: 'foundation' },
  'berachain.com': { name: 'Berachain Foundation', id: 'bera-foundation', kind: 'foundation' },
  'berachain-apis.com': { name: 'Berachain Foundation', id: 'bera-foundation', kind: 'foundation' },
  'soniclabs.com': { name: 'Sonic Foundation', id: 'sonic-foundation', kind: 'foundation' },
  'kaia.io': { name: 'Kaia Foundation', id: 'kaia-foundation', kind: 'foundation' },
  'gnosischain.com': { name: 'Gnosis Foundation', id: 'gnosis-foundation', kind: 'foundation' },
  'celo.org': { name: 'Celo Foundation', id: 'celo-foundation', kind: 'foundation' },
  'moonbeam.network': { name: 'Moonbeam Foundation', id: 'moonbeam-foundation', kind: 'foundation' },
  'polygon-rpc.com': { name: 'Polygon Foundation', id: 'polygon-foundation', kind: 'foundation' },
  'bnbchain.org': { name: 'BNB Chain', id: 'bnb-foundation', kind: 'foundation' },
  'flare.network': { name: 'Flare Foundation', id: 'flare-foundation', kind: 'foundation' },
  'frax.com': { name: 'Frax', id: 'frax', kind: 'foundation' },
  'mode.network': { name: 'Mode Foundation', id: 'mode-foundation', kind: 'foundation' },
  'gobob.xyz': { name: 'BOB', id: 'bob-foundation', kind: 'foundation' },
  'hemi.network': { name: 'Hemi Foundation', id: 'hemi-foundation', kind: 'foundation' },
  'plume.org': { name: 'Plume Foundation', id: 'plume-foundation', kind: 'foundation' },
  'orderly.network': { name: 'Orderly', id: 'orderly-foundation', kind: 'foundation' },
  'citrea.xyz': { name: 'Citrea', id: 'citrea-foundation', kind: 'foundation' },
  'somnia.network': { name: 'Somnia', id: 'somnia-foundation', kind: 'foundation' },
  'reya.network': { name: 'Reya', id: 'reya-foundation', kind: 'foundation' },
  '0g.ai': { name: '0G Foundation', id: '0g-foundation', kind: 'foundation' },
  'ethereal.trade': { name: 'Ethereal', id: 'ethereal-foundation', kind: 'foundation' },
  'openledger.xyz': { name: 'OpenLedger', id: 'openledger-foundation', kind: 'foundation' },
  'zora.energy': { name: 'Zora', id: 'zora-foundation', kind: 'foundation' },
  'taiko.xyz': { name: 'Taiko', id: 'taiko-foundation', kind: 'foundation' },
  'manta.network': { name: 'Manta Foundation', id: 'manta-foundation', kind: 'foundation' },
  'etherlink.com': { name: 'Etherlink', id: 'etherlink-foundation', kind: 'foundation' },
  'gravity.xyz': { name: 'Gravity', id: 'gravity-foundation', kind: 'foundation' },
  'lisk.com': { name: 'Lisk', id: 'lisk-foundation', kind: 'foundation' },
  'katana.network': { name: 'Katana', id: 'katana-foundation', kind: 'foundation' },
  'morphl2.io': { name: 'Morph', id: 'morph-foundation', kind: 'foundation' },
  'usecorn.com': { name: 'Corn', id: 'corn-foundation', kind: 'foundation' },
  'corn-rpc.com': { name: 'Corn', id: 'corn-foundation', kind: 'foundation' },
  'degen.tips': { name: 'Degen', id: 'degen-foundation', kind: 'other' },
  'fantom.network': { name: 'Fantom Foundation', id: 'fantom-foundation', kind: 'foundation' },
  'aurora.dev': { name: 'Aurora', id: 'aurora-foundation', kind: 'foundation' },
  'harmony.one': { name: 'Harmony', id: 'harmony-foundation', kind: 'foundation' },
  'metis.io': { name: 'Metis Foundation', id: 'metis-foundation', kind: 'foundation' },
  'kava.io': { name: 'Kava Foundation', id: 'kava-foundation', kind: 'foundation' },
  'cronos.org': { name: 'Cronos Foundation', id: 'cronos-foundation', kind: 'foundation' },
  'zircuit.com': { name: 'Zircuit', id: 'zircuit-foundation', kind: 'foundation' },
  'merlinchain.io': { name: 'Merlin', id: 'merlin-foundation', kind: 'foundation' },
  'xlayer.tech': { name: 'OKX X Layer', id: 'xlayer-foundation', kind: 'foundation' },
  'okx.com': { name: 'OKX', id: 'okx', kind: 'foundation' },
  'coredao.org': { name: 'Core DAO', id: 'core-foundation', kind: 'foundation' },
  'confluxrpc.com': { name: 'Conflux Foundation', id: 'conflux-foundation', kind: 'foundation' },
  'astar.network': { name: 'Astar Foundation', id: 'astar-foundation', kind: 'foundation' },

  // Additional public aggregators seen in LayerZero's own RPC list.
  '0xrpc.io': { name: '0xRPC', id: '0xrpc', kind: 'public-rpc-aggregator' },
  '48.club': { name: '48 Club', id: '48club', kind: 'public-rpc-aggregator' },
  'flashbots.net': { name: 'Flashbots', id: 'flashbots', kind: 'public-rpc-aggregator' },
  'merkle.io': { name: 'Merkle', id: 'merkle', kind: 'public-rpc-aggregator' },
  'nodereal.io': { name: 'NodeReal', id: 'nodereal', kind: 'public-rpc-aggregator' },
  'nirvanalabs.xyz': { name: 'Nirvana Labs', id: 'nirvana', kind: 'public-rpc-aggregator' },
  'blockrazor.xyz': { name: 'BlockRazor', id: 'blockrazor', kind: 'public-rpc-aggregator' },
  'din.dev': { name: 'DIN', id: 'din', kind: 'public-rpc-aggregator' },
  'gashawk.io': { name: 'GasHawk', id: 'gashawk', kind: 'public-rpc-aggregator' },
  'mevblocker.io': { name: 'MEV Blocker', id: 'mevblocker', kind: 'public-rpc-aggregator' },
  'p2pify.com': { name: 'Chainstack', id: 'chainstack', kind: 'public-rpc-aggregator' },

  // Official hosts that were falling through as unknown apexes — same
  // operator, many URLs. Mapping them stops "3 branded domains" looking
  // like three independent RPCs.
  'gatenode.cc': { name: 'Gate Foundation', id: 'gate-foundation', kind: 'foundation' },
  'gatelayer.io': { name: 'Gate Foundation', id: 'gate-foundation', kind: 'foundation' },
  'anubispace.org': { name: 'Anubis Foundation', id: 'anubis-foundation', kind: 'foundation' },
  'risechain.com': { name: 'RISE', id: 'rise-foundation', kind: 'foundation' },
  'sophonapi.com': { name: 'Sophon', id: 'sophon-foundation', kind: 'foundation' },
  'onbeam.com': { name: 'Beam', id: 'beam-foundation', kind: 'foundation' },
  'pharos.xyz': { name: 'Pharos', id: 'pharos-foundation', kind: 'foundation' },
  'robinhood.com': { name: 'Robinhood', id: 'robinhood', kind: 'foundation' },
  'morph.network': { name: 'Morph', id: 'morph-foundation', kind: 'foundation' },
};

/**
 * Subdomain overrides — matched before apex lookup. Useful when the apex
 * is shared across products (e.g. a project's apex hosts both their
 * chain's native RPC and an unrelated service).
 */
const SUBDOMAIN_OVERRIDES: Array<{ pattern: RegExp; provider: ProviderDef }> = [
  {
    pattern: /(^|\.)g\.alchemy\.com$/i,
    provider: APEX_PROVIDERS['alchemy.com'],
  },
  // Official Monad public mirrors are branded monad.xyz but run by different operators.
  // https://docs.monad.xyz/developer-essentials/network-information
  {
    pattern: /^rpc\.monad\.xyz$/i,
    provider: APEX_PROVIDERS['quiknode.pro'],
  },
  {
    pattern: /^rpc1\.monad\.xyz$/i,
    provider: APEX_PROVIDERS['alchemy.com'],
  },
  {
    pattern: /^rpc2\.monad\.xyz$/i,
    provider: APEX_PROVIDERS['goldsky.com'],
  },
  {
    pattern: /^rpc3\.monad\.xyz$/i,
    provider: APEX_PROVIDERS['ankr.com'],
  },
  {
    pattern: /^rpc-mainnet\.monadinfra\.com$/i,
    provider: APEX_PROVIDERS['monadinfra.com'],
  },
  // Ink official hosts: Gelato + QuickNode branded paths on the same apex.
  {
    pattern: /^rpc-gel\.inkonchain\.com$/i,
    provider: APEX_PROVIDERS['gelato.digital'],
  },
  {
    pattern: /^rpc-qnd\.inkonchain\.com$/i,
    provider: APEX_PROVIDERS['quiknode.pro'],
  },
  // Foundation-branded QuickNode mirrors — same pattern as Ink/Monad.
  {
    pattern: /^rpc-quicknode\.sophon\.xyz$/i,
    provider: APEX_PROVIDERS['quiknode.pro'],
  },
  {
    pattern: /^rpc-quicknode\.morphl2\.io$/i,
    provider: APEX_PROVIDERS['quiknode.pro'],
  },
  {
    pattern: /^rpc-quicknode\.morph\.network$/i,
    provider: APEX_PROVIDERS['quiknode.pro'],
  },
];

export type ResolvedProvider = {
  id: string;
  name: string;
  kind: ProviderDef['kind'] | 'unknown';
  verified: boolean;
};

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function extractApex(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

export function identifyProvider(url: string): ResolvedProvider {
  const hostname = extractHostname(url);
  if (!hostname) {
    return { id: `unknown:${url}`, name: url, kind: 'unknown', verified: false };
  }

  for (const override of SUBDOMAIN_OVERRIDES) {
    if (override.pattern.test(hostname)) {
      return { ...override.provider, kind: override.provider.kind, verified: true };
    }
  }

  const apex = extractApex(hostname);
  const direct = APEX_PROVIDERS[apex];
  if (direct) {
    return { id: direct.id, name: direct.name, kind: direct.kind, verified: true };
  }

  return {
    id: `host:${apex}`,
    name: apex,
    kind: 'unknown',
    verified: false,
  };
}

/**
 * Given a list of RPC URLs, return how many distinct providers they
 * actually represent. Two URLs mapped to the same provider id count as
 * one. Two URLs on different unrecognised apexes count as two.
 */
export function countDistinctProviders(urls: string[]): number {
  const ids = new Set<string>();
  for (const url of urls) {
    ids.add(identifyProvider(url).id);
  }
  return ids.size;
}

/**
 * Group URLs by resolved provider, preserving insertion order of first
 * occurrence per provider.
 */
export function groupByProvider(urls: string[]): Array<{ provider: ResolvedProvider; urls: string[] }> {
  const byId = new Map<string, { provider: ResolvedProvider; urls: string[] }>();
  for (const url of urls) {
    const provider = identifyProvider(url);
    const existing = byId.get(provider.id);
    if (existing) {
      existing.urls.push(url);
    } else {
      byId.set(provider.id, { provider, urls: [url] });
    }
  }
  return Array.from(byId.values());
}
