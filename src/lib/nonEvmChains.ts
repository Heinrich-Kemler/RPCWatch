/**
 * Non-EVM single-provider L1 seed table.
 *
 * Neither chainid.network nor chainlist.org cover non-EVM ecosystems in
 * depth, so we hard-code the chains and the public endpoints we have
 * manually verified respond anonymously (no API key, no sign-up).
 *
 * Verification notes (2026-04):
 *   - Endpoints listed here were probed with a standard chain-specific
 *     request (Solana getHealth, Sui sui_getChainIdentifier, Near status,
 *     TON getMasterchainInfo, Aptos GET /v1, Stacks GET /extended/v1/info).
 *   - Endpoints that returned 4xx for anonymous clients (e.g. Ankr Tron,
 *     BlastAPI Sui, dRPC Solana free-tier) are NOT listed — they require
 *     a key in practice.
 *   - Aptos, TON, and Stacks each have genuinely thin anonymous coverage:
 *     the chain foundations dominate, and most partner providers gate
 *     behind sign-up. That single-provider exposure is real, not an
 *     artifact of missing entries.
 *
 * Review quarterly. When adding a provider, probe first, verify anonymous
 * access, and only then add it here.
 *
 * chainId convention: synthetic negative numbers so no collision with
 * real EVM chainIds. `caip2` is the authoritative identifier.
 */

export type NonEvmChainSeed = {
  chainId: number;
  name: string;
  shortName: string;
  arch: 'solana' | 'move' | 'substrate' | 'ton' | 'tron' | 'stacks' | 'bitcoin' | 'other';
  caip2: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  infoURL: string;
  rpcs: Array<{
    url: string;
    operator: string;
    tracking?: 'none' | 'limited' | 'yes' | 'unspecified';
    isOpenSource?: boolean;
  }>;
  /**
   * DefiLlama display name for the TVL join. DefiLlama keys chains on
   * `gecko_id` and `name`; we map to the name so resolution works.
   */
  defillamaName: string;
};

export const NON_EVM_SEED: NonEvmChainSeed[] = [
  {
    chainId: -1_000_001,
    name: 'Solana',
    shortName: 'solana',
    arch: 'solana',
    caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    infoURL: 'https://solana.com',
    defillamaName: 'Solana',
    rpcs: [
      {
        url: 'https://api.mainnet-beta.solana.com',
        operator: 'Solana Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://solana-rpc.publicnode.com',
        operator: 'PublicNode',
        tracking: 'none',
      },
      {
        url: 'https://api.blockeden.xyz/solana/67nCBdZQSH9z3YqDDjdm',
        operator: 'BlockEden',
        tracking: 'limited',
      },
    ],
  },
  {
    chainId: -1_000_002,
    name: 'Sui',
    shortName: 'sui',
    arch: 'move',
    caip2: 'sui:mainnet',
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
    infoURL: 'https://sui.io',
    defillamaName: 'Sui',
    rpcs: [
      {
        url: 'https://fullnode.mainnet.sui.io',
        operator: 'Mysten Labs',
        tracking: 'unspecified',
      },
      {
        url: 'https://sui-rpc.publicnode.com',
        operator: 'PublicNode',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_003,
    name: 'Aptos',
    shortName: 'aptos',
    arch: 'move',
    caip2: 'aptos:mainnet',
    nativeCurrency: { name: 'Aptos', symbol: 'APT', decimals: 8 },
    infoURL: 'https://aptoslabs.com',
    defillamaName: 'Aptos',
    rpcs: [
      {
        url: 'https://fullnode.mainnet.aptoslabs.com/v1',
        operator: 'Aptos Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://api.mainnet.aptoslabs.com/v1',
        operator: 'Aptos Foundation',
        tracking: 'unspecified',
      },
    ],
  },
  {
    chainId: -1_000_004,
    name: 'Near',
    shortName: 'near',
    arch: 'other',
    caip2: 'near:mainnet',
    nativeCurrency: { name: 'NEAR', symbol: 'NEAR', decimals: 24 },
    infoURL: 'https://near.org',
    defillamaName: 'Near',
    rpcs: [
      {
        url: 'https://rpc.mainnet.near.org',
        operator: 'Near Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://rpc.near.org',
        operator: 'Near Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://near.lava.build',
        operator: 'Lava Network',
        tracking: 'yes',
      },
      {
        url: 'https://near.drpc.org',
        operator: 'dRPC',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_005,
    name: 'TON',
    shortName: 'ton',
    arch: 'ton',
    caip2: 'ton:mainnet',
    nativeCurrency: { name: 'Toncoin', symbol: 'TON', decimals: 9 },
    infoURL: 'https://ton.org',
    defillamaName: 'Ton',
    rpcs: [
      {
        url: 'https://toncenter.com/api/v2/jsonRPC',
        operator: 'TON Foundation',
        tracking: 'unspecified',
      },
    ],
  },
  {
    chainId: -1_000_006,
    name: 'Tron',
    shortName: 'tron',
    arch: 'tron',
    caip2: 'tron:mainnet',
    nativeCurrency: { name: 'TRON', symbol: 'TRX', decimals: 6 },
    infoURL: 'https://tron.network',
    defillamaName: 'Tron',
    rpcs: [
      {
        url: 'https://api.trongrid.io',
        operator: 'TronGrid',
        tracking: 'unspecified',
      },
      {
        url: 'https://tron-rpc.publicnode.com',
        operator: 'PublicNode',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_007,
    name: 'Stacks',
    shortName: 'stacks',
    arch: 'stacks',
    caip2: 'stacks:mainnet',
    nativeCurrency: { name: 'Stacks', symbol: 'STX', decimals: 6 },
    infoURL: 'https://www.stacks.co/',
    defillamaName: 'Stacks',
    rpcs: [
      {
        url: 'https://api.mainnet.hiro.so',
        operator: 'Hiro Systems',
        tracking: 'unspecified',
      },
    ],
  },
];
