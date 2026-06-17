import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**', 'src/lib/hooks/**', 'src/lib/utils/**'],
      exclude: ['**/node_modules/**', 'src/tests/**', '**/__mocks__/**', '**/*.config.*'],
      thresholds: {
        'src/lib/i18n/adapter.ts': { lines: 65 },
        'src/lib/i18n/client.ts': { lines: 55 },
      },
    },
  },
})
