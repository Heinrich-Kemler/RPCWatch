/**
 * In-memory token-bucket rate limiter.
 *
 * Used to blunt abuse of the health endpoint, which fans out to
 * third-party RPCs on each request. Keyed by client IP.
 *
 * Caveats:
 *   - Per-instance memory. On Vercel's serverless runtime, different
 *     cold lambdas will have independent buckets, so the limit is
 *     actually "per-instance-per-IP". That's good enough to stop a
 *     single attacker saturating a warm lambda but won't stop a
 *     distributed / cold-start-heavy abuse pattern.
 *   - For production-grade global limits, move buckets to Vercel KV,
 *     Upstash Redis, or similar. Deferred until abuse is observed.
 *
 * Defaults chosen for the health endpoint:
 *   - 10 tokens burst
 *   - 0.5 tokens/sec refill (30 req/min sustained)
 */

type Bucket = {
  tokens: number;
  lastRefill: number;
};

type LimiterConfig = {
  capacity: number;
  refillPerSec: number;
};

const BUCKETS = new Map<string, Map<string, Bucket>>();

function bucketsFor(namespace: string): Map<string, Bucket> {
  let ns = BUCKETS.get(namespace);
  if (!ns) {
    ns = new Map();
    BUCKETS.set(namespace, ns);
  }
  return ns;
}

export function consumeRateLimit(
  namespace: string,
  key: string,
  config: LimiterConfig,
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const ns = bucketsFor(namespace);
  const now = Date.now();
  const bucket = ns.get(key) ?? { tokens: config.capacity, lastRefill: now };

  const elapsed = Math.max(0, (now - bucket.lastRefill) / 1000);
  bucket.tokens = Math.min(config.capacity, bucket.tokens + elapsed * config.refillPerSec);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    ns.set(key, bucket);
    const retryAfterSec = Math.ceil((1 - bucket.tokens) / config.refillPerSec);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  bucket.tokens -= 1;
  ns.set(key, bucket);
  return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSec: 0 };
}

export function clientIpFromRequest(request: Request): string {
  // Vercel and most proxies populate x-forwarded-for with the client IP
  // first. Trust only the leftmost value; anything after is untrusted.
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
