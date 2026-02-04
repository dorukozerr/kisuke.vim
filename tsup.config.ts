import { defineConfig } from 'tsup';

export default defineConfig((_options) => ({
  name: 'kisuke.vim',
  entry: ['src/index.ts', 'src/llm/mcp/server/*'],
  format: ['esm'],
  banner: {
    js: `/**
*
*   ██ ▄█▀ ██▓  ██████  █    ██  ██ ▄█▀▓█████
*    ██▄█▒ ▓██▒▒██    ▒  ██  ▓██▒ ██▄█▒ ▓█   ▀
*   ▓███▄░ ▒██▒░ ▓██▄   ▓██  ▒██░▓███▄░ ▒███
*   ▓██ █▄ ░██░  ▒   ██▒▓▓█  ░██░▓██ █▄ ▒▓█  ▄
*   ▒██▒ █▄░██░▒██████▒▒▒▒█████▓ ▒██▒ █▄░▒████▒
*   ▒ ▒▒ ▓▒░▓  ▒ ▒▓▒ ▒ ░░▒▓▒ ▒ ▒ ▒ ▒▒ ▓▒░░ ▒░ ░
*   ░ ░▒ ▒░ ▒ ░░ ░▒  ░ ░░░▒░ ░ ░ ░ ░▒ ▒░ ░ ░  ░
*   ░ ░░ ░  ▒ ░░  ░  ░   ░░░ ░ ░ ░ ░░ ░    ░
*   ░  ░    ░        ░     ░     ░  ░      ░  ░
*
*   At first this project was my sandbox environment for vim script, then
*   I set some simple and primitive goals while feeling like its beyond my
*   scope and I can't finish them. Now I'm unemployed again and I'm
*   trying to turn this into my goth waifu AI girlfriend like my life
*   depends on it. My only goal is building something that gonna keep me
*   in this inefficient, meaningless, delusional, poser, tryhard, fake
*   state I just can't or don't or not prefer to let go.
*
**/`
  },
  outDir: 'dist',
  target: 'esnext',
  platform: 'node',
  clean: true,
  sourcemap: 'inline'
}));
