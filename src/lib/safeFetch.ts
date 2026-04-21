/**
 * Defensive wrappers around outbound fetch for URLs sourced from
 * untrusted registries (chainlist.org, ethereum-lists, user input).
 *
 * Purpose: block SSRF. Before `src/lib/health.ts` calls fetch on an RPC
 * URL that originated from a public community registry, it must run
 * that URL past `assertSafeProbeTarget` here. If upstream data is ever
 * poisoned with a URL pointing at internal services, the cloud
 * metadata endpoint, or loopback, we refuse the fetch and report the
 * endpoint as "error" instead of attempting it.
 *
 * Checks applied:
 *   - Must parse as a valid URL.
 *   - Scheme must be http: or https:.
 *   - Port, if explicit, must be 80, 443, 8545, 8546, or empty.
 *     (Standard RPC ports. AWS metadata sits on 80 at 169.254.169.254
 *     so port alone isn't enough — the IP check below handles it.)
 *   - Hostname must not be a literal IP in a private, loopback,
 *     link-local, or CGNAT range.
 *   - Hostname must not be in an explicit block list (localhost,
 *     known metadata aliases).
 *
 * Limitations:
 *   - We do NOT resolve DNS and re-check the resolved IP, which means
 *     DNS-rebinding attacks are partially mitigated (only literal-IP
 *     hostnames are caught). A fully robust fix requires resolving
 *     the hostname, connecting to the resolved IP, and validating
 *     the IP is public. Deferred because it significantly complicates
 *     the fetch path and Node's built-in fetch doesn't expose that
 *     knob cleanly. Combine with an egress firewall that blocks
 *     RFC1918 ranges from the runtime for full coverage.
 */

const DISALLOWED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  'broadcasthost',
  'metadata',
  'metadata.google.internal',
  'metadata.azure.com',
  'metadata.azure.internal',
]);

const ALLOWED_PORTS = new Set(['', '80', '443', '8545', '8546']);

function isIpv4Literal(host: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

function isIpv4Private(host: string): boolean {
  const parts = host.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  // Loopback
  if (a === 127) return true;
  // RFC1918
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  // Link-local / metadata
  if (a === 169 && b === 254) return true;
  // CGNAT
  if (a === 100 && b >= 64 && b <= 127) return true;
  // Reserved / unspec
  if (a === 0) return true;
  // Multicast / experimental
  if (a >= 224) return true;
  return false;
}

function isIpv6Literal(host: string): boolean {
  // URL() strips the brackets into .hostname; the raw ipv6 contains ':'
  return host.includes(':');
}

function isIpv6Private(host: string): boolean {
  const lower = host.toLowerCase();
  // Loopback
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
  // Link-local fe80::/10
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
  // Unique local fc00::/7
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
  // Unspecified ::
  if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
  // Any IPv4-mapped IPv6 (::ffff:*) — the URL class normalises these into
  // compressed form, so we can't reliably extract the embedded v4.
  // Reject the entire class defensively. Legitimate public IPv6 hosts
  // never need this format.
  if (/^::ffff:/i.test(lower)) return true;
  // IPv4-compatible (deprecated, but same concern)
  if (/^::(?:[0-9a-f]{1,4}:)?[0-9a-f]{1,4}$/i.test(lower) && lower !== '::1') return true;
  return false;
}

export class UnsafeProbeTargetError extends Error {
  url: string;
  reason: string;
  constructor(url: string, reason: string) {
    super(`Refusing to fetch ${url}: ${reason}`);
    this.name = 'UnsafeProbeTargetError';
    this.url = url;
    this.reason = reason;
  }
}

export function assertSafeProbeTarget(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeProbeTargetError(rawUrl, 'invalid URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new UnsafeProbeTargetError(rawUrl, `disallowed scheme ${parsed.protocol}`);
  }

  if (parsed.port !== '' && !ALLOWED_PORTS.has(parsed.port)) {
    throw new UnsafeProbeTargetError(rawUrl, `disallowed port ${parsed.port}`);
  }

  // URL().hostname keeps brackets around IPv6 literals; strip them so
  // string comparisons against canonical forms (`::1`, `fe80::…`) work.
  let host = parsed.hostname.toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  if (!host) {
    throw new UnsafeProbeTargetError(rawUrl, 'empty hostname');
  }
  if (DISALLOWED_HOSTNAMES.has(host)) {
    throw new UnsafeProbeTargetError(rawUrl, `blocked hostname ${host}`);
  }

  if (isIpv4Literal(host)) {
    if (isIpv4Private(host)) {
      throw new UnsafeProbeTargetError(rawUrl, `blocked IPv4 ${host}`);
    }
    return;
  }

  if (isIpv6Literal(host)) {
    if (isIpv6Private(host)) {
      throw new UnsafeProbeTargetError(rawUrl, `blocked IPv6 ${host}`);
    }
    return;
  }
}

export function isSafeProbeTarget(url: string): boolean {
  try {
    assertSafeProbeTarget(url);
    return true;
  } catch {
    return false;
  }
}
