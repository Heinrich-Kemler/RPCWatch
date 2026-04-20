import Dashboard from '../components/Dashboard';
import { getCachedChains } from '../lib/chains.server';

export const revalidate = 3600;

export default async function HomePage() {
  const chains = await getCachedChains();
  return <Dashboard chains={chains} />;
}
