import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/setup.ts'],
    // Los tests de integracion comparten una unica base efimera: se ejecutan
    // en serie para que no interfieran entre si.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
