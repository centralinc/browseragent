import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: false,
  clean: true,
  splitting: false,
  minify: false,
  target: 'node16',
  outDir: 'dist',
  external: [
    'playwright',
    '@playwright/test',
  ],
})