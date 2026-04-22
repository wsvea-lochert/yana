import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const aliases = {
  '@shared': resolve(__dirname, 'src/shared'),
  '@main': resolve(__dirname, 'src/main'),
  '@renderer': resolve(__dirname, 'src/renderer'),
  '@overlay': resolve(__dirname, 'src/renderer/overlay')
}

export default defineConfig({
  resolve: { alias: aliases },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/main/index.ts',
        'src/renderer/main.tsx',
        'src/renderer/overlay/main.tsx',
        'src/renderer/components/ui/**'
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80
      }
    },
    projects: [
      {
        resolve: { alias: aliases },
        test: {
          name: 'main',
          globals: true,
          environment: 'node',
          include: [
            'tests/unit/db/**/*.test.ts',
            'tests/unit/services/**/*.test.ts',
            'tests/unit/shared/**/*.test.ts',
            'tests/unit/main/**/*.test.ts',
            'tests/unit/ipc/**/*.test.ts',
            'tests/integration/**/*.test.ts'
          ]
        }
      },
      {
        resolve: { alias: aliases },
        test: {
          name: 'renderer',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['tests/setup.ts'],
          include: [
            'tests/unit/hooks/**/*.test.{ts,tsx}',
            'tests/unit/stores/**/*.test.{ts,tsx}',
            'tests/unit/components/**/*.test.{ts,tsx}'
          ]
        }
      }
    ]
  }
})
