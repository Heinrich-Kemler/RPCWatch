import type { RiskLevel } from './chains';

export type RiskPalette = {
  label: string;
  badge: string;
  ring: string;
  text: string;
  chip: string;
  bar: string;
  dot: string;
};

const palettes: Record<RiskLevel, RiskPalette> = {
  critical: {
    label: 'CRITICAL',
    badge: 'bg-critical/15 text-critical border-critical/40',
    ring: 'ring-critical/40',
    text: 'text-critical',
    chip: 'bg-critical/20 text-critical border border-critical/40',
    bar: 'bg-critical',
    dot: 'bg-critical',
  },
  'at-risk': {
    label: 'AT RISK',
    badge: 'bg-warning/15 text-warning border-warning/40',
    ring: 'ring-warning/40',
    text: 'text-warning',
    chip: 'bg-warning/20 text-warning border border-warning/40',
    bar: 'bg-warning',
    dot: 'bg-warning',
  },
  safe: {
    label: 'SAFE',
    badge: 'bg-safe/15 text-safe border-safe/40',
    ring: 'ring-safe/40',
    text: 'text-safe',
    chip: 'bg-safe/20 text-safe border border-safe/40',
    bar: 'bg-safe',
    dot: 'bg-safe',
  },
  'no-data': {
    label: 'NO PUBLIC RPC',
    badge: 'bg-muted/20 text-muted border-muted/40',
    ring: 'ring-muted/40',
    text: 'text-muted',
    chip: 'bg-muted/20 text-muted border border-muted/40',
    bar: 'bg-muted',
    dot: 'bg-muted',
  },
};

export function riskPalette(level: RiskLevel): RiskPalette {
  return palettes[level];
}

export function rpcCountPalette(count: number): RiskPalette {
  if (count === 0) return palettes['no-data'];
  if (count === 1) return palettes.critical;
  if (count <= 3) return palettes['at-risk'];
  return palettes.safe;
}
