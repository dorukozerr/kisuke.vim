import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/llm/mcp/server/*'],
  format: ['esm'],
  splitting: true,
  bundle: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  skipNodeModulesBundle: true,
  target: 'esnext',
  platform: 'node'
});
