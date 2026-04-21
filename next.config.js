/**
 * Next.js config.
 *
 * Primary reason this file exists: apply defense-in-depth security
 * headers to every response. RPC Watch is a read-only public dashboard,
 * so the attack surface is narrow — but these headers block the obvious
 * fallbacks if anything ever goes wrong upstream.
 *
 * Notes on the CSP:
 *   - 'unsafe-inline' on script-src is required by Next.js hydration
 *     until we switch on the experimental nonce pipeline. It's the
 *     standard Next.js baseline.
 *   - connect-src explicitly lists our outbound data sources plus
 *     arbitrary https: — RPC health checks call RPC endpoints, which
 *     can be any host.
 *   - frame-ancestors 'none' blocks clickjacking.
 */

/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "form-action 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
