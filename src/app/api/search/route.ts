import { getCachedChains } from '../../../lib/chains.server';
import { searchChains } from '../../../lib/chains';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() ?? '';

  if (!query) {
    return Response.json([]);
  }

  const chains = await getCachedChains();
  const results = searchChains(chains, query);

  return Response.json(results);
}
