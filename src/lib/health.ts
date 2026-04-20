import {
  RPC_TIMEOUT_MS,
  SLOW_RPC_THRESHOLD_MS,
  isHttpRpc,
  type ProcessedChain,
} from './chains';

export type RpcHealthStatus = 'online' | 'slow' | 'offline' | 'error';

export type RpcHealthResult = {
  url: string;
  displayUrl: string;
  status: RpcHealthStatus;
  latencyMs: number | null;
  blockNumber: string | null;
  error: string | null;
};

export type ChainHealthResponse = {
  chainId: number;
  checkedAt: string;
  results: RpcHealthResult[];
  onlineCount: number;
  offlineCount: number;
};

type JsonRpcResponse = {
  result?: string;
  error?: {
    code?: number;
    message?: string;
  };
};

function truncateUrl(url: string, maxLength = 72): string {
  if (url.length <= maxLength) {
    return url;
  }

  return `${url.slice(0, maxLength - 1)}…`;
}

function toDecimalBlockNumber(blockNumberHex: string): string {
  try {
    return BigInt(blockNumberHex).toString();
  } catch {
    return blockNumberHex;
  }
}

function isAbortLikeError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function isOfflineFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'TypeError' ||
    /fetch failed/i.test(error.message) ||
    /network/i.test(error.message) ||
    /socket/i.test(error.message)
  );
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

async function checkRpc(url: string): Promise<RpcHealthResult> {
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
      cache: 'no-store',
    });

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      return {
        url,
        displayUrl: truncateUrl(url),
        status: 'error',
        latencyMs,
        blockNumber: null,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    const payload = (await response.json()) as JsonRpcResponse;

    if (payload.error) {
      return {
        url,
        displayUrl: truncateUrl(url),
        status: 'error',
        latencyMs,
        blockNumber: null,
        error: payload.error.message ?? 'JSON-RPC error',
      };
    }

    if (typeof payload.result !== 'string') {
      return {
        url,
        displayUrl: truncateUrl(url),
        status: 'error',
        latencyMs,
        blockNumber: null,
        error: 'Missing eth_blockNumber result',
      };
    }

    return {
      url,
      displayUrl: truncateUrl(url),
      status: latencyMs > SLOW_RPC_THRESHOLD_MS ? 'slow' : 'online',
      latencyMs,
      blockNumber: toDecimalBlockNumber(payload.result),
      error: null,
    };
  } catch (error) {
    const isOffline = isAbortLikeError(error) || isOfflineFetchError(error);

    return {
      url,
      displayUrl: truncateUrl(url),
      status: isOffline ? 'offline' : 'error',
      latencyMs: null,
      blockNumber: null,
      error: isAbortLikeError(error)
        ? `Request timed out after ${RPC_TIMEOUT_MS}ms`
        : toErrorMessage(error),
    };
  }
}

export async function checkChainHealth(chain: ProcessedChain): Promise<ChainHealthResponse> {
  const publicHttpRpcs = chain.publicRpcs.filter((rpcUrl) => isHttpRpc(rpcUrl));
  const results = await Promise.all(publicHttpRpcs.map((rpcUrl) => checkRpc(rpcUrl)));

  return {
    chainId: chain.chainId,
    checkedAt: new Date().toISOString(),
    results,
    onlineCount: results.filter((result) => result.status === 'online' || result.status === 'slow')
      .length,
    offlineCount: results.filter((result) => result.status === 'offline').length,
  };
}
