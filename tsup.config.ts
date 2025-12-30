import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  splitting: false,
  clean: true,
  minify: true,
  treeshake: true,
  outDir: 'dist',
  skipNodeModulesBundle: true,
  target: 'esnext',
  platform: 'node'
});
