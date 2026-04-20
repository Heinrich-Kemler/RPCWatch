# RPC Watch

**Which blockchains are one outage away from going dark?**

RPC Watch is a public security dashboard that counts the public RPC
endpoints listed for every known EVM chain and flags the ones that rely on
a single point of failure.

Data comes from **two community registries, merged**:

- **[chainlist.org/rpcs.json](https://chainlist.org/rpcs.json)** — per-RPC
  privacy (`tracking: none / limited / yes`), open-source flag per RPC,
  TVL per chain (sourced from DefiLlama), and the structured `isTestnet`
  signal.
- **[chainid.network/chains.json](https://chainid.network/chains.json)**
  — the raw registry behind chainlist.org, maintained by the
  [ethereum-lists/chains](https://github.com/ethereum-lists/chains)
  project.

We deduplicate by RPC URL and keep every endpoint either source has seen,
so coverage is broader (and more resistant to any one registry being
offline or stale) than either source alone.

---

## Contents

- [What this shows](#what-this-shows)
- [Important disclaimer — our only data source](#important-disclaimer--our-only-data-source)
- [Why single-RPC chains are a security problem](#why-single-rpc-chains-are-a-security-problem)
- [Can you read a blockchain without an RPC? Can an RPC manipulate data?](#can-you-read-a-blockchain-without-an-rpc-can-an-rpc-manipulate-data)
- [Getting started](#getting-started)
- [How the data is processed](#how-the-data-is-processed)
- [Project structure](#project-structure)
- [API](#api)
- [Contributing](#contributing)
- [Credits](#credits)

---

## What this shows

For every chain in the registry, RPC Watch:

1. Pulls the list of RPC endpoints.
2. Filters out entries that contain a `${PLACEHOLDER}` (these require an
   API key and aren't truly public).
3. Counts what's left — the **public RPC count**.
4. Buckets the chain:
   - **Critical** — exactly 1 public RPC. A single outage kills it.
   - **At risk** — 2 or 3 public RPCs. Redundancy is thin.
   - **Safe** — 4 or more public RPCs.
   - **No public RPC** — only API-key endpoints are listed.
5. Hides testnets and known-deprecated networks by default.

A curated list of notable chains (Ethereum, Base, Arbitrum, Optimism, zkSync,
Linea, Scroll, Polygon, Avalanche, etc.) is pinned to the top of each view so
familiar names aren't buried underneath long-tail rollups.

---

## Important disclaimer — our data sources

**RPC Watch pulls from two community registries and merges them.** Both
are community-maintained; neither is authoritative.

- [chainlist.org/rpcs.json](https://chainlist.org/rpcs.json) — the list
  powering [chainlist.org](https://chainlist.org/), maintained by
  DefiLlama. Carries per-RPC metadata (privacy policy, open-source flag)
  and chain-level TVL.
- [chainid.network/chains.json](https://chainid.network/chains.json) —
  the [ethereum-lists/chains](https://github.com/ethereum-lists/chains)
  registry. Anyone can open a PR to add or change an endpoint.

Known limitations even with both sources:

- A chain may have a public RPC that neither registry has indexed —
  particularly newer rollups or private deployments.
- A registered RPC may be offline, misconfigured, or rate-limited in
  practice even though it's listed.
- A chain showing as *Critical* here doesn't automatically mean its
  community has no alternatives — it means only one is listed publicly.
- A chain showing as *Safe* doesn't guarantee every listed endpoint
  works, is well-operated, or is trustworthy.
- TVL is self-reported by DefiLlama and only available for ~12% of
  chains. We only surface it when > $1M and only for mainnet.

Always verify endpoints directly with the project before relying on them,
especially if assets are at stake.

---

## Why single-RPC chains are a security problem

An RPC endpoint is the only thing your wallet, your dApp frontend, your
backend, and your indexer actually talk to. If the chain has one public
RPC and it goes down, everything downstream effectively can't see the
chain at all. But it's worse than just a reliability story — RPC trust is
a real attack surface:

- **A malicious or compromised RPC can lie.** It can return wrong
  balances, wrong transaction receipts, wrong gas estimates, or wrong
  contract read results. A wallet or frontend that blindly trusts it will
  show the user those wrong values.
- **Phishing-grade attacks work through RPCs.** Front-end compromises on
  Web3 projects — DNS hijacks, malicious package releases, compromised
  CDN scripts — frequently work by swapping in an RPC or pre-signed
  transaction the user then signs from a UI they already trust. The
  attack surface isn't the chain; it's everything between the user and
  the chain.
- **Single-RPC chains make this one-and-done.** Every wallet, bridge
  indexer, liquidation bot, and block explorer on that chain is pulling
  from the same endpoint. Taking over that endpoint means you effectively
  MITM the whole ecosystem at once.

On historical incidents (front-end takeovers, wallet UIs fed bad data,
liquid-staking and restaking protocols affected by infrastructure-level
issues including publicly-discussed cases around KelpDAO, Curve, and
others): RPC Watch does not make specific claims about individual
incidents beyond what each project has disclosed. The point is that the
category of attack — "your view of the chain is only as trustworthy as
the RPC serving it" — is well-established, and single-RPC chains offer
zero diversity against it. Always read the project's own post-mortems for
specifics.

---

## Can you read a blockchain without an RPC? Can an RPC manipulate data?

Short answer: **mostly yes, and yes.**

### Reading the chain without an RPC

To read any EVM chain you need *something* that speaks the JSON-RPC
protocol. In practice that's:

1. **Your own node** (geth/reth/erigon/nethermind, or an archive node).
   This is the only way to not trust someone else for reads.
2. **A third-party RPC provider** (a public endpoint, Infura, Alchemy,
   QuickNode, etc.). Most wallets and dApps use this by default.
3. **A light client** (stateless clients, Helios, etc.). These verify
   proofs against block headers and don't blindly trust the RPC's
   responses for state reads. Light-client adoption is still limited.

If you have none of the above, you cannot query balances, call
contracts, estimate gas, or broadcast transactions. A wallet with no RPC
configured is effectively disconnected from the chain. Signed
transactions can be constructed offline, but you still need an RPC (or
someone running one) to broadcast them.

### Can an RPC manipulate data?

**Yes, within limits.** A single RPC provider can't forge finalized
on-chain state — the chain itself is authoritative and other nodes won't
accept a fake block. But a malicious RPC can absolutely manipulate
**what a specific user sees**:

- Serve stale or fabricated `eth_call` / `eth_getBalance` results.
- Return a different `chainId` on `net_version` or `eth_chainId` to
  trick a wallet into signing for the wrong chain.
- Censor transactions or silently drop them instead of broadcasting.
- Front-run or sandwich by delaying broadcast and inserting their own
  transaction first.
- Present a different set of mempool events to indexers.

A signed transaction is cryptographically protected — an RPC can't
change its content after the user signs it. But an RPC can influence
**which transaction the user is asked to sign**: a compromised dApp that
simulates a transaction through a malicious RPC will display the
simulation's output to the user, and the user signs based on that
display. That's how front-end hijack attacks convert a clean signing
flow into a drain.

The defense is endpoint diversity: multiple independent RPCs,
light-client verification, or running your own node. Single-RPC chains
have none of these by construction.

---

## Getting started

Requires Node 18+ and npm.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

One-off CLI report of single- and low-RPC chains:

```bash
npm run report:single-rpcs
# writes data/latest-report.txt
```

---

## How the data is processed

Core pipeline lives in [`src/lib/chains.ts`](src/lib/chains.ts):

1. `fetchRawChains()` pulls `chains.json` with Next's `fetch` (revalidated
   every hour — see `CHAIN_DATA_CACHE_SECONDS`).
2. `processChains()` normalises each entry, classifies RPCs as
   HTTP / WebSocket / template, and computes `publicRpcCount`,
   `riskLevel`, `riskScore`, `isTestnet`, `isDeprecated`, `isNotable`.
3. `getCachedChains()` in [`chains.server.ts`](src/lib/chains.server.ts)
   wraps the whole thing in `unstable_cache` so every route shares one
   in-memory copy.

Template filter (the "needs an API key" exclusion):

```ts
const TEMPLATE_RPC_PATTERN = /\$\{[^}]+\}/;
```

Testnet detection matches on name — `testnet`, `sepolia`, `goerli`,
`ropsten`, `rinkeby`, `holesky`, `fuji`, `chapel`, `mumbai`. Deprecated
chain IDs are hardcoded for the well-known Ethereum testnets that have
been retired.

Notable chains live in [`src/lib/notableChains.ts`](src/lib/notableChains.ts).
Add a chainId there and it'll pin to the top of any filtered view it
belongs to.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                     # Dashboard (SSR)
│   ├── layout.tsx                   # Inter font + theme
│   ├── globals.css                  # Tailwind + base styles
│   ├── chain/[chainId]/page.tsx     # Detail page (SSR)
│   ├── chain/[chainId]/not-found.tsx
│   └── api/
│       ├── chains/route.ts              # GET full list
│       ├── chains/[chainId]/health/     # GET live eth_blockNumber per RPC
│       ├── search/route.ts              # GET fuzzy search
│       └── stats/route.ts               # GET aggregate stats
├── components/
│   ├── Dashboard.tsx        # Hero, stats, filters, table (client)
│   ├── CopyButton.tsx       # Copy-to-clipboard helper
│   └── ShareButtons.tsx     # Copy link + X intent
└── lib/
    ├── chains.ts            # Types + processing pipeline
    ├── chains.server.ts     # Next-cached wrapper
    ├── health.ts            # Live RPC ping logic
    ├── health.server.ts     # In-memory health cache
    ├── notableChains.ts     # Curated pin list
    └── risk.ts              # Tailwind class palette per risk level
scripts/
└── check-single-rpcs.ts     # CLI report writer
```

---

## API

All API routes return JSON. None require auth.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/chains` | Full processed chain list. Cached 1h. |
| `GET` | `/api/stats` | Totals and top-critical sample. Cached 1h. |
| `GET` | `/api/search?q=...` | Fuzzy search by name, short name, chainId, or RPC URL. |
| `GET` | `/api/chains/:chainId/health` | Live `eth_blockNumber` ping across the chain's public HTTP RPCs. 60s cache. |

---

## Contributing

Found a chain we misclassified, or want to add one to the notable list?

- Wrong RPC list → open a PR against
  [ethereum-lists/chains](https://github.com/ethereum-lists/chains).
  That fixes RPC Watch automatically within the next hourly revalidation.
- Wrong notable/not-notable flag → edit
  [`src/lib/notableChains.ts`](src/lib/notableChains.ts) and send a PR.
- Bugs, UI ideas, or feature requests → open an issue on this repo.

---

## Credits

- Data: [ethereum-lists/chains](https://github.com/ethereum-lists/chains).
- Built by crypto Goblin & Shai — best frens.

Not financial or security advice. Verify everything.
