import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getProcessedChains } from '../src/lib/chains';

function formatChainLine(name: string, chainId: number, rpcUrls: string[]): string {
  return `${name} | ${chainId} | ${rpcUrls.join(', ')}`;
}

async function main() {
  const chains = await getProcessedChains();
  const criticalChains = chains.filter((chain) => chain.publicRpcCount === 1);
  const atRiskChains = chains.filter(
    (chain) => chain.publicRpcCount >= 2 && chain.publicRpcCount <= 3,
  );
  const reportLines = [
    `Generated: ${new Date().toISOString()}`,
    `Total chains: ${chains.length}`,
    `Single RPC (CRITICAL): ${criticalChains.length}`,
    ...criticalChains.map((chain) => formatChainLine(chain.name, chain.chainId, chain.publicRpcs)),
    '',
    `2-3 RPCs (AT RISK): ${atRiskChains.length}`,
    ...atRiskChains.map((chain) => formatChainLine(chain.name, chain.chainId, chain.publicRpcs)),
    '',
  ];

  const report = reportLines.join('\n');
  const outputDirectory = path.join(process.cwd(), 'data');
  const outputPath = path.join(outputDirectory, 'latest-report.txt');

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, report, 'utf8');

  console.log(report);
  console.log(`Saved report to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
