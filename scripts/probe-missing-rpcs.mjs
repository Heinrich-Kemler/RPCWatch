/**
 * One-off discovery probe (2026-08-28).
 *
 * Re-verifies RPC Watch-discovered endpoints and hunts for anonymous
 * public RPCs that chainlist.org / ethereum-lists have not indexed yet.
 *
 * Only records a hit when eth_chainId returns the expected chain id
 * from an unauthenticated client.
 */

const CHAINLIST_URL = 'https://chainlist.org/rpcs.json';
const ETHEREUM_LISTS_URL = 'https://chainid.network/chains.json';
const TIMEOUT_MS = 6_000;
const CONCURRENCY = 12;

const EXISTING_DISCOVERED = [
  { chainId: 988, url: 'https://stable.gateway.tenderly.co' },
  { chainId: 2818, url: 'https://morph.drpc.org' },
  { chainId: 4217, url: 'https://tempo-rpc.publicnode.com' },
  { chainId: 4217, url: 'https://1rpc.io/tempo' },
  { chainId: 4217, url: 'https://tempo.gateway.tenderly.co' },
  { chainId: 6900, url: 'https://nibiru.publicnode.com' },
  { chainId: 16661, url: 'https://0g.drpc.org' },
  { chainId: 16661, url: 'https://0g-rpc.publicnode.com' },
  { chainId: 9745, url: 'https://plasma.gateway.tenderly.co' },
  { chainId: 9745, url: 'https://plasma-mainnet.gateway.tatum.io' },
  { chainId: 30, url: 'https://rootstock-mainnet.gateway.tatum.io' },
  { chainId: 4326, url: 'https://1rpc.io/megaeth' },
  { chainId: 4326, url: 'https://megaeth.gateway.tenderly.co' },
  { chainId: 1868, url: 'https://soneium-rpc.publicnode.com' },
  { chainId: 1868, url: 'https://soneium.gateway.tenderly.co' },
  { chainId: 33139, url: 'https://apechain.gateway.tenderly.co' },
  { chainId: 239, url: 'https://tac.drpc.org' },
];

// Pocket Network public portal (keyless as of 2026-08).
const POCKET = [
  { chainId: 1, url: 'https://eth.api.pocket.network' },
  { chainId: 10, url: 'https://op.api.pocket.network' },
  { chainId: 56, url: 'https://bsc.api.pocket.network' },
  { chainId: 100, url: 'https://gnosis.api.pocket.network' },
  { chainId: 122, url: 'https://fuse.api.pocket.network' },
  { chainId: 130, url: 'https://unichain.api.pocket.network' },
  { chainId: 137, url: 'https://poly.api.pocket.network' },
  { chainId: 146, url: 'https://sonic.api.pocket.network' },
  { chainId: 204, url: 'https://opbnb.api.pocket.network' },
  { chainId: 248, url: 'https://oasys.api.pocket.network' },
  { chainId: 250, url: 'https://fantom.api.pocket.network' },
  { chainId: 252, url: 'https://fraxtal.api.pocket.network' },
  { chainId: 288, url: 'https://boba.api.pocket.network' },
  { chainId: 324, url: 'https://zksync-era.api.pocket.network' },
  { chainId: 999, url: 'https://hyperliquid.api.pocket.network' },
  { chainId: 1088, url: 'https://metis.api.pocket.network' },
  { chainId: 1101, url: 'https://poly-zkevm.api.pocket.network' },
  { chainId: 1284, url: 'https://moonbeam.api.pocket.network' },
  { chainId: 1285, url: 'https://moonriver.api.pocket.network' },
  { chainId: 1329, url: 'https://sei.api.pocket.network' },
  { chainId: 2222, url: 'https://kava.api.pocket.network' },
  { chainId: 4689, url: 'https://iotex.api.pocket.network' },
  { chainId: 8217, url: 'https://kaia.api.pocket.network' },
  { chainId: 8453, url: 'https://base.api.pocket.network' },
  { chainId: 1666600000, url: 'https://harmony.api.pocket.network' },
  { chainId: 42161, url: 'https://arb-one.api.pocket.network' },
  { chainId: 42220, url: 'https://celo.api.pocket.network' },
  { chainId: 43114, url: 'https://avax.api.pocket.network' },
  { chainId: 57073, url: 'https://ink.api.pocket.network' },
  { chainId: 59144, url: 'https://linea.api.pocket.network' },
  { chainId: 80094, url: 'https://bera.api.pocket.network' },
  { chainId: 81457, url: 'https://blast.api.pocket.network' },
  { chainId: 167000, url: 'https://taiko.api.pocket.network' },
  { chainId: 534352, url: 'https://scroll.api.pocket.network' },
  { chainId: 810180, url: 'https://zklink-nova.api.pocket.network' },
];

// Official / documented public endpoints that often skip the registries.
const DOCUMENTED = [
  { chainId: 999, url: 'https://rpc.hyperliquid.xyz/evm' },
  { chainId: 999, url: 'https://hyperliquid.drpc.org' },
  { chainId: 999, url: 'https://1rpc.io/hyperliquid' },
  { chainId: 999, url: 'https://public.1rpc.io/hyperliquid' },
  { chainId: 999, url: 'https://hyperliquid.gateway.tenderly.co' },
  { chainId: 999, url: 'https://hyperliquid-rpc.publicnode.com' },
  { chainId: 999, url: 'https://rpc.ankr.com/hyperliquid' },
  { chainId: 143, url: 'https://rpc.monad.xyz' },
  { chainId: 143, url: 'https://rpc1.monad.xyz' },
  { chainId: 143, url: 'https://rpc2.monad.xyz' },
  { chainId: 143, url: 'https://rpc3.monad.xyz' },
  { chainId: 143, url: 'https://rpc-mainnet.monadinfra.com' },
  { chainId: 143, url: 'https://monad.drpc.org' },
  { chainId: 143, url: 'https://monad.gateway.tenderly.co' },
  { chainId: 143, url: 'https://monad-rpc.publicnode.com' },
  { chainId: 143, url: 'https://1rpc.io/monad' },
  { chainId: 4326, url: 'https://mainnet.megaeth.com/rpc' },
  { chainId: 4326, url: 'https://megaeth.drpc.org' },
  { chainId: 1868, url: 'https://rpc.soneium.org' },
  { chainId: 1868, url: 'https://soneium.drpc.org' },
  { chainId: 130, url: 'https://mainnet.unichain.org' },
  { chainId: 130, url: 'https://unichain.drpc.org' },
  { chainId: 130, url: 'https://unichain-rpc.publicnode.com' },
  { chainId: 130, url: 'https://unichain.gateway.tenderly.co' },
  { chainId: 130, url: 'https://1rpc.io/unichain' },
  { chainId: 480, url: 'https://worldchain-mainnet.g.alchemy.com/public' },
  { chainId: 480, url: 'https://worldchain.drpc.org' },
  { chainId: 480, url: 'https://worldchain-rpc.publicnode.com' },
  { chainId: 480, url: 'https://worldchain.gateway.tenderly.co' },
  { chainId: 480, url: 'https://1rpc.io/worldchain' },
  { chainId: 57073, url: 'https://rpc-gel.inkonchain.com' },
  { chainId: 57073, url: 'https://rpc-qnd.inkonchain.com' },
  { chainId: 57073, url: 'https://ink.drpc.org' },
  { chainId: 57073, url: 'https://ink-rpc.publicnode.com' },
  { chainId: 57073, url: 'https://ink.gateway.tenderly.co' },
  { chainId: 1514, url: 'https://mainnet.storyrpc.io' },
  { chainId: 1514, url: 'https://mainnet.story-rpc.com' },
  { chainId: 1514, url: 'https://story.drpc.org' },
  { chainId: 1514, url: 'https://story-rpc.publicnode.com' },
  { chainId: 1514, url: 'https://1rpc.io/story' },
  { chainId: 2741, url: 'https://api.mainnet.abs.xyz' },
  { chainId: 2741, url: 'https://abstract.drpc.org' },
  { chainId: 2741, url: 'https://abstract.gateway.tenderly.co' },
  { chainId: 988, url: 'https://stable.drpc.org' },
  { chainId: 988, url: 'https://stable-rpc.publicnode.com' },
  { chainId: 988, url: 'https://1rpc.io/stable' },
  { chainId: 9745, url: 'https://plasma.drpc.org' },
  { chainId: 9745, url: 'https://plasma-rpc.publicnode.com' },
  { chainId: 9745, url: 'https://1rpc.io/plasma' },
  { chainId: 4217, url: 'https://tempo.drpc.org' },
  { chainId: 16661, url: 'https://1rpc.io/0g' },
  { chainId: 16661, url: 'https://0g.gateway.tenderly.co' },
  { chainId: 239, url: 'https://tac-rpc.publicnode.com' },
  { chainId: 239, url: 'https://tac.gateway.tenderly.co' },
  { chainId: 239, url: 'https://1rpc.io/tac' },
  { chainId: 2818, url: 'https://rpc.morphl2.io' },
  { chainId: 2818, url: 'https://morph-rpc.publicnode.com' },
  { chainId: 2818, url: 'https://morph.gateway.tenderly.co' },
  { chainId: 6900, url: 'https://nibiru.drpc.org' },
  { chainId: 6900, url: 'https://evm-rpc.nibiru.fi' },
  { chainId: 33139, url: 'https://apechain.drpc.org' },
  { chainId: 33139, url: 'https://apechain-rpc.publicnode.com' },
  { chainId: 33139, url: 'https://1rpc.io/apechain' },
  { chainId: 30, url: 'https://public-node.rsk.co' },
  { chainId: 30, url: 'https://rootstock.drpc.org' },
  { chainId: 50104, url: 'https://rpc.sophon.xyz' },
  { chainId: 50104, url: 'https://sophon.drpc.org' },
  { chainId: 4114, url: 'https://rpc.citrea.xyz' },
  { chainId: 4114, url: 'https://citrea.drpc.org' },
  { chainId: 747474, url: 'https://rpc.katanarpc.com' },
  { chainId: 747474, url: 'https://katana.drpc.org' },
  { chainId: 747474, url: 'https://katana.gateway.tenderly.co' },
  { chainId: 98866, url: 'https://rpc.plume.org' },
  { chainId: 98866, url: 'https://plume.drpc.org' },
  { chainId: 43111, url: 'https://rpc.hemi.network/rpc' },
  { chainId: 43111, url: 'https://hemi.drpc.org' },
  { chainId: 31612, url: 'https://rpc-http.mezo.org' },
  { chainId: 31612, url: 'https://mezo.drpc.org' },
  { chainId: 1440000, url: 'https://rpc.xrplevm.org' },
  { chainId: 1440000, url: 'https://xrplevm.drpc.org' },
  { chainId: 8333, url: 'https://mainnet-rpc.b3.fun' },
  { chainId: 8333, url: 'https://b3.drpc.org' },
  { chainId: 5330, url: 'https://mainnet.superseed.xyz' },
  { chainId: 5330, url: 'https://superseed.drpc.org' },
  { chainId: 478, url: 'https://rpc.form.network/http' },
  { chainId: 478, url: 'https://form.drpc.org' },
  { chainId: 291, url: 'https://rpc.orderly.network' },
  { chainId: 291, url: 'https://orderly.drpc.org' },
  { chainId: 61166, url: 'https://rpc.treasure.lol' },
  { chainId: 61166, url: 'https://treasure.drpc.org' },
  { chainId: 1729, url: 'https://rpc.reya.network' },
  { chainId: 1729, url: 'https://reya.drpc.org' },
];

const PRIORITY_SLUGS = {
  1: ['eth', 'ethereum'],
  10: ['optimism', 'op'],
  14: ['flare'],
  25: ['cronos'],
  30: ['rootstock', 'rsk'],
  56: ['bsc', 'bnb'],
  100: ['gnosis', 'xdai'],
  122: ['fuse'],
  130: ['unichain'],
  137: ['polygon', 'matic'],
  143: ['monad'],
  146: ['sonic'],
  169: ['manta'],
  196: ['xlayer'],
  204: ['opbnb'],
  239: ['tac'],
  250: ['fantom', 'ftm'],
  252: ['fraxtal'],
  288: ['boba'],
  291: ['orderly'],
  324: ['zksync', 'zksync-era'],
  369: ['pulsechain', 'pulse'],
  478: ['form'],
  480: ['worldchain', 'world'],
  570: ['rollux'],
  988: ['stable'],
  999: ['hyperliquid', 'hyperevm', 'hype'],
  1088: ['metis'],
  1101: ['polygon-zkevm', 'zkevm'],
  1284: ['moonbeam'],
  1329: ['sei'],
  1514: ['story'],
  1612: ['openledger'],
  1729: ['reya'],
  1868: ['soneium'],
  2020: ['ronin'],
  2222: ['kava'],
  2741: ['abstract'],
  2818: ['morph'],
  3073: ['movement'],
  4114: ['citrea'],
  4217: ['tempo'],
  4326: ['megaeth'],
  4613: ['very'],
  4689: ['iotex'],
  5000: ['mantle'],
  5330: ['superseed'],
  6900: ['nibiru'],
  8217: ['kaia', 'klaytn'],
  8333: ['b3'],
  8453: ['base'],
  9745: ['plasma'],
  10088: ['gatelayer'],
  13371: ['immutable'],
  16661: ['0g', '0g-mainnet'],
  29548: ['mchverse'],
  31612: ['mezo'],
  33139: ['apechain', 'ape'],
  34443: ['mode'],
  42161: ['arbitrum', 'arb'],
  42220: ['celo'],
  42793: ['etherlink'],
  43111: ['hemi'],
  43114: ['avalanche', 'avax'],
  50104: ['sophon'],
  57073: ['ink'],
  59144: ['linea'],
  60808: ['bob'],
  61166: ['treasure'],
  80094: ['berachain', 'bera'],
  81457: ['blast'],
  88888: ['chiliz'],
  98866: ['plume'],
  167000: ['taiko'],
  333999: ['polis'],
  534352: ['scroll'],
  747474: ['katana'],
  7777777: ['zora'],
  1440000: ['xrplevm', 'xrpl-evm'],
};

function extractRpcUrls(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => (typeof entry === 'string' ? entry : entry?.url))
    .filter((url) => typeof url === 'string' && url.trim())
    .map((url) => url.trim());
}

function toChainId(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.json();
}

async function probe(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'manual',
    });
    const latencyMs = Date.now() - started;
    if (!response.ok) {
      return { ok: false, status: response.status, latencyMs, error: `HTTP ${response.status}` };
    }
    const payload = await response.json();
    if (payload?.error) {
      return { ok: false, status: response.status, latencyMs, error: payload.error.message ?? 'rpc error' };
    }
    if (typeof payload?.result !== 'string') {
      return { ok: false, status: response.status, latencyMs, error: 'no result' };
    }
    return { ok: true, status: response.status, latencyMs, chainId: Number.parseInt(payload.result, 16) };
  } catch (error) {
    return { ok: false, status: 0, latencyMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  }
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function aggregatorCandidates(chainId, slugs) {
  const urls = [];
  for (const slug of slugs) {
    urls.push(
      `https://${slug}.drpc.org`,
      `https://${slug}-rpc.publicnode.com`,
      `https://${slug}.publicnode.com`,
      `https://1rpc.io/${slug}`,
      `https://${slug}.gateway.tenderly.co`,
      `https://${slug}-mainnet.gateway.tatum.io`,
      `https://${slug}.api.onfinality.io/public`,
      `https://${slug}.therpc.io`,
      `https://rpc.ankr.com/${slug}`,
      `https://${slug}.public.blastapi.io`,
      `https://${slug}.blockpi.network/v1/rpc/public`,
      `https://${slug}.llamarpc.com`,
      `https://${slug}-pokt.nodies.app`,
      `https://endpoints.omniatech.io/v1/${slug}/mainnet/public`,
    );
  }
  return urls.map((url) => ({ chainId, url }));
}

async function main() {
  console.log('Fetching registries…');
  const [chainlist, ethereumLists] = await Promise.all([
    fetchJson(CHAINLIST_URL),
    fetchJson(ETHEREUM_LISTS_URL),
  ]);

  const byId = new Map();
  for (const raw of [...ethereumLists, ...chainlist]) {
    const chainId = toChainId(raw.chainId);
    if (chainId === null) continue;
    const existing = byId.get(chainId) ?? {
      chainId,
      name: raw.name ?? `Chain ${chainId}`,
      urls: new Set(),
      tvl: null,
      isTestnet: false,
    };
    if (raw.name) existing.name = raw.name;
    if (typeof raw.isTestnet === 'boolean') existing.isTestnet = raw.isTestnet;
    if (typeof raw.tvl === 'number' && raw.tvl > 0) existing.tvl = raw.tvl;
    for (const url of extractRpcUrls(raw.rpc)) existing.urls.add(url);
    byId.set(chainId, existing);
  }

  const known = new Set();
  for (const chain of byId.values()) {
    for (const url of chain.urls) known.add(`${chain.chainId}|${url}`);
  }

  const candidates = new Map();
  const add = (entry, source) => {
    const key = `${entry.chainId}|${entry.url}`;
    if (!candidates.has(key)) candidates.set(key, { ...entry, source });
  };

  for (const entry of EXISTING_DISCOVERED) add(entry, 'reverify');
  for (const entry of POCKET) add(entry, 'pocket');
  for (const entry of DOCUMENTED) add(entry, 'documented');
  for (const [chainId, slugs] of Object.entries(PRIORITY_SLUGS)) {
    for (const entry of aggregatorCandidates(Number(chainId), slugs)) add(entry, 'aggregator');
  }

  const work = Array.from(candidates.values());
  console.log(`Probing ${work.length} candidate URLs…`);

  const results = await runPool(work, async (entry, index) => {
    if ((index + 1) % 50 === 0) {
      console.log(`  ${index + 1}/${work.length}`);
    }
    const probed = await probe(entry.url);
    return { ...entry, ...probed };
  });

  const reverified = [];
  const stale = [];
  const newHits = [];
  const alreadyListedHits = [];

  for (const result of results) {
    const listed = known.has(`${result.chainId}|${result.url}`);
    const matches = result.ok && result.chainId === result.chainId && result.chainId === Number(result.chainId);
    const expectedOk = result.ok && Number(result.chainId) === Number(candidates.get(`${result.chainId}|${result.url}`)?.chainId ?? result.chainId);
    // result.chainId is overwritten by probe — keep expected from the entry
  }

  // Re-walk with original expected chain id stored separately
  for (let i = 0; i < results.length; i += 1) {
    const expected = work[i].chainId;
    const result = results[i];
    const listed = known.has(`${expected}|${result.url}`);
    const ok = result.ok && result.chainId === expected;
    const record = {
      chainId: expected,
      name: byId.get(expected)?.name ?? `Chain ${expected}`,
      url: result.url,
      source: result.source,
      listed,
      latencyMs: result.latencyMs,
      error: result.error ?? null,
      returnedChainId: result.ok ? result.chainId : null,
    };

    if (result.source === 'reverify') {
      if (ok) reverified.push(record);
      else stale.push(record);
      continue;
    }

    if (!ok) continue;
    if (listed) alreadyListedHits.push(record);
    else newHits.push(record);
  }

  const uniqueNew = [];
  const seenNew = new Set();
  for (const hit of newHits) {
    const key = `${hit.chainId}|${hit.url}`;
    if (seenNew.has(key)) continue;
    seenNew.add(key);
    uniqueNew.push(hit);
  }
  uniqueNew.sort((a, b) => a.chainId - b.chainId || a.url.localeCompare(b.url));

  const output = {
    probedAt: new Date().toISOString(),
    candidateCount: work.length,
    registryChainCount: byId.size,
    reverified,
    stale,
    newHits: uniqueNew,
    alreadyListedHits: alreadyListedHits.length,
  };

  const fs = await import('node:fs/promises');
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile('data/probe-2026-08-28.json', JSON.stringify(output, null, 2));

  console.log('\n=== REVERIFY OK ===');
  for (const row of reverified) console.log(`  ${row.chainId} ${row.url}`);
  console.log('\n=== STALE ===');
  for (const row of stale) console.log(`  ${row.chainId} ${row.url} :: ${row.error}`);
  console.log('\n=== NEW ANONYMOUS HITS (not in registries) ===');
  for (const row of uniqueNew) {
    console.log(`  ${row.chainId} ${row.name}  ${row.url}  [${row.source}] ${row.latencyMs}ms`);
  }
  console.log(`\nNew hits: ${uniqueNew.length}`);
  console.log(`Reverified: ${reverified.length}`);
  console.log(`Stale: ${stale.length}`);
  console.log('Wrote data/probe-2026-08-28.json');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
