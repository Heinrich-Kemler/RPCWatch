import { getCachedChainById } from '../../../../../lib/chains.server';
import { getCachedChainHealth } from '../../../../../lib/health.server';

type RouteContext = {
  params: Promise<{
    chainId: string;
  }>;
};

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: RouteContext) {
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
  return Response.json(health);
}
