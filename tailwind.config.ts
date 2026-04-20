import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f7f8fb',
        card: '#ffffff',
        surface: '#f1f5f9',
        border: '#e2e8f0',
        borderStrong: '#cbd5e1',
        text: '#0f172a',
        muted: '#64748b',
        accent: '#2563eb',
        critical: '#dc2626',
        warning: '#ea580c',
        caution: '#ca8a04',
        safe: '#16a34a',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.1)',
        lift: '0 1px 3px rgba(15, 23, 42, 0.06), 0 20px 40px -24px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
