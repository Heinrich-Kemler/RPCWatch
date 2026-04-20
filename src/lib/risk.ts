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
    badge: 'bg-red-50 text-critical border-red-200',
    ring: 'ring-red-200',
    text: 'text-critical',
    chip: 'bg-red-50 text-critical border border-red-200',
    bar: 'bg-critical',
    dot: 'bg-critical',
  },
  'at-risk': {
    label: 'AT RISK',
    badge: 'bg-orange-50 text-warning border-orange-200',
    ring: 'ring-orange-200',
    text: 'text-warning',
    chip: 'bg-orange-50 text-warning border border-orange-200',
    bar: 'bg-warning',
    dot: 'bg-warning',
  },
  safe: {
    label: 'SAFE',
    badge: 'bg-green-50 text-safe border-green-200',
    ring: 'ring-green-200',
    text: 'text-safe',
    chip: 'bg-green-50 text-safe border border-green-200',
    bar: 'bg-safe',
    dot: 'bg-safe',
  },
  'no-data': {
    label: 'NO PUBLIC RPC',
    badge: 'bg-slate-100 text-muted border-slate-200',
    ring: 'ring-slate-200',
    text: 'text-muted',
    chip: 'bg-slate-100 text-muted border border-slate-200',
    bar: 'bg-slate-400',
    dot: 'bg-slate-400',
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
