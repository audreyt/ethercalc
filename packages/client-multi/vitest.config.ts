import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// jsdom env so React Testing Library can mount components.
// Coverage gate: 100% on Foldr, state, and all non-pure-layout components.
// App.tsx and main.tsx are excluded — both are integration glue that require
// full DOM+window bootstrapping (see FINDINGS.md for rationale).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/App.tsx',
        'src/main.tsx',
        'src/index.ts',
      ],
      reporter: ['text', 'json-summary', 'lcov'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
