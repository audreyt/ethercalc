import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';

// jsdom env so React Testing Library can mount components.
// Coverage gate: 100% on App, Foldr, state, import logic, and components.
// main.tsx remains browser boot glue covered by the built application smoke.
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
