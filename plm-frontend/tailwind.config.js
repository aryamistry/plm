/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f1117',
        'bg-surface': '#161b27',
        'bg-elevated': '#1e2535',
        'bg-border': '#2a3347',
        'accent-blue': '#3b82f6',
        'accent-blue-dim': '#1d4ed8',
        'accent-green': '#22c55e',
        'accent-amber': '#f59e0b',
        'accent-red': '#ef4444',
        'accent-purple': '#a855f7',
        'accent-cyan': '#06b6d4',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#475569',
      },
      fontFamily: {
        display: ['"DM Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        'card': '6px',
        'input': '4px',
      },
    },
  },
  plugins: [],
}
