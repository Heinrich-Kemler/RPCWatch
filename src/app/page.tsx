import Dashboard from '../components/Dashboard';
import { getCachedChainBundle } from '../lib/chains.server';

export const revalidate = 3600;

export default async function HomePage() {
  const { chains, summary } = await getCachedChainBundle();
  return <Dashboard chains={chains} summary={summary} />;
}
