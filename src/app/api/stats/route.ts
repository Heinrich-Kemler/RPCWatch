import { buildChainStats } from '../../../lib/chains';
import { getCachedChains } from '../../../lib/chains.server';

export const revalidate = 3_600;

export async function GET() {
  const chains = await getCachedChains();
  return Response.json(buildChainStats(chains));
}
