import { getCachedChainById } from '../../../../../lib/chains.server';
import { getCachedChainHealth } from '../../../../../lib/health.server';
import { clientIpFromRequest, consumeRateLimit } from '../../../../../lib/rateLimit';

type RouteContext = {
  params: Promise<{
    chainId: string;
  }>;
};

export const dynamic = 'force-dynamic';

const RATE_LIMIT = {
  namespace: 'health',
  capacity: 10,
  refillPerSec: 0.5, // ~30 req/min sustained, 10-req burst
};

export async function GET(request: Request, context: RouteContext) {
  const clientIp = clientIpFromRequest(request);
  const limit = consumeRateLimit(RATE_LIMIT.namespace, clientIp, {
    capacity: RATE_LIMIT.capacity,
    refillPerSec: RATE_LIMIT.refillPerSec,
  });
  if (!limit.allowed) {
    return Response.json(
      {
        error: 'Too many requests',
        retryAfterSec: limit.retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'retry-after': String(limit.retryAfterSec),
          'x-ratelimit-remaining': '0',
        },
      },
    );
  }

  const { chainId } = await context.params;
  const parsedChainId = Number.parseInt(chainId, 10);

  if (!Number.isInteger(parsedChainId)) {
    return Response.json({ error: 'Invalid chainId parameter.' }, { status: 400 });
  }

  const chain = await getCachedChainById(parsedChainId);

  if (!chain) {
    return Response.json({ error: `Chain ${parsedChainId} not found.` }, { status: 404 });
  }

  const health = await getCachedChainHealth(chain);
  return Response.json(health, {
    headers: {
      'x-ratelimit-remaining': String(limit.remaining),
    },
  });
}
