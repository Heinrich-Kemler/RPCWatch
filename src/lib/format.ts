import type { RpcTracking } from './chains';

export function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export type TrackingUi = {
  label: string;
  description: string;
  tone: 'safe' | 'caution' | 'warning' | 'muted';
};

export function describeTracking(tracking: RpcTracking): TrackingUi {
  switch (tracking) {
    case 'none':
      return {
        label: 'No tracking',
        description: 'Operator declares no user-level logging.',
        tone: 'safe',
      };
    case 'limited':
      return {
        label: 'Limited tracking',
        description: 'Operator logs metadata (IPs, basic request info) but not full payloads.',
        tone: 'caution',
      };
    case 'yes':
      return {
        label: 'Tracks users',
        description: 'Operator logs request metadata — treat as a trust boundary.',
        tone: 'warning',
      };
    case 'unspecified':
      return {
        label: 'Tracking unspecified',
        description: 'Operator has not declared a policy.',
        tone: 'muted',
      };
    case 'unknown':
    default:
      return {
        label: 'Unknown',
        description: 'Privacy classification not in our sources.',
        tone: 'muted',
      };
  }
}
