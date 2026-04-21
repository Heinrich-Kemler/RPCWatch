'use client';

import { useEffect, useState } from 'react';

type ShareButtonsProps = {
  chainName: string;
  publicRpcCount: number;
  path: string;
};

export default function ShareButtons({ chainName, publicRpcCount, path }: ShareButtonsProps) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  const tweetText =
    `${chainName} only has ${publicRpcCount} public RPC endpoint${publicRpcCount === 1 ? '' : 's'}` +
    ` on chainlist. Check your chain's risk at ${url} via @rpcwatch`;

  const tweetHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onCopyLink}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-text transition hover:border-critical hover:text-critical"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <a
        href={tweetHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-text transition hover:border-critical hover:text-critical"
      >
        Share on X
      </a>
    </div>
  );
}
