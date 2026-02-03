import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: options.watch
    ? ['src/**/*']
    : ['src/index.ts', 'src/llm/mcp/server/*'],
  format: ['esm'],
  // splitting: true,
  // bundle: true,
  // clean: !options.watch,
  // treeshake: true,
  outDir: 'dist',
  // skipNodeModulesBundle: true,
  target: 'esnext',
  platform: 'node'
}));
