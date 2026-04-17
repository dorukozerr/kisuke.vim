# kisuke.vim

A minimal AI assistant integration for Vim.

[Watch the demo on YouTube](https://www.youtube.com/watch?v=cCadzIf8Ql0)

## About

Kisuke.vim is a Vim plugin that brings LLM chat into the editor as a split buffer, with multi-provider support, local session persistence, and file context marking. It exists because I wanted an AI chat that lived inside Vim rather than next to it.

It's intentionally narrow in scope: chat, sessions, context. No inline completions, no agentic multi-step flows in the published version.

## Status

The `main` branch contains the stable plugin described below. Active exploration (custom MCP client with per-tool-call approval, planned ACP integration) lives on a development branch and is not yet released. The ecosystem around editor-AI integration is moving fast — projects like ACP and opencode now cover much of what I was building toward, so future direction is undecided.

If you want a small, predictable AI chat that lives in a Vim split, this plugin works. If you want agent-style tooling, consider those alternatives.

## Features

- Multi-session chat interface in a Vim split buffer
- Multiple providers and models (Anthropic, OpenAI, Google, Grok)
- Buffer menu for session management (create, switch, delete, resume)
- File context marking (mark files to include in prompts)
- Visual-mode code block selection for context
- Syntax highlighting for code blocks in chat
- Web search support for Anthropic models (others planned)

## Supported Providers and Models

**Anthropic:** sonnet-4.5, sonnet-4, opus-4.1, opus-4, sonnet-3.7, haiku-3.7, opus-3.7

**OpenAI:** gpt-4.1, gpt-4.1-mini, gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4, gpt-3.5-turbo

**Google:** gemini-2.5-pro, gemini-2.5-flash

**Grok:** grok-4

## Installation

### Prerequisites

`node` and `yarn` installed globally.

```bash
npm i -g yarn@latest
```

### Using Vim packages (recommended)

```bash
mkdir -p ~/.vim/pack/plugins/start
cd ~/.vim/pack/plugins/start
git clone https://github.com/dorukozerr/kisuke.vim.git
cd kisuke.vim
yarn build
```

### Using vim-plug

```vim
Plug 'dorukozerr/kisuke.vim', { 'do': 'yarn build' }
```

Then run `:PlugInstall`.

### Using Vundle

```vim
Plugin 'dorukozerr/kisuke.vim'
```

Then run `:PluginInstall`, then `cd ~/.vim/bundle/kisuke.vim && yarn build`.

### Using Pathogen

```bash
cd ~/.vim/bundle
git clone https://github.com/dorukozerr/kisuke.vim.git
cd kisuke.vim
yarn build
```

## Configuration

Kisuke prompts for an API key the first time you use a provider. Config is stored at `~/.config/kisuke/config.json` and can be edited manually.

To switch provider or model, use the buffer menu (`<Leader>ko`).

## Key Mappings

Recommended mappings for your `.vimrc`:

```vim
nnoremap <Leader>ko:  KisukeOpen<CR>
nnoremap <Leader>km:  KisukeMarkFocusedFile<CR>
vnoremap <Leader>kh:  KisukeMarkHighlighted<CR>
nnoremap <Leader>krc: KisukeRemoveLastMarkedCodeBlock<CR>
nnoremap <Leader>kc:  KisukeCreateNewSession<CR>
nnoremap <Leader>kd:  KisukeDeleteSession<CR>
nnoremap <Leader>krs: KisukeResumeLastSession<CR>
```

| Mapping       | Command                            | Description                             | Mode |
| ------------- | ---------------------------------- | --------------------------------------- | ---- |
| `<leader>ko`  | `:KisukeOpen`                      | Open chat buffer & menu                 | n    |
| `<leader>km`  | `:KisukeMarkFocusedFile`           | Mark/unmark focused file for context    | n    |
| `<leader>kh`  | `:KisukeMarkHighlighted`           | Mark highlighted code block for context | v    |
| `<leader>krc` | `:KisukeRemoveLastMarkedCodeBlock` | Remove last added code block            | n    |
| `<leader>kc`  | `:KisukeCreateNewSession`          | Create new session                      | n    |
| `<leader>kd`  | `:KisukeDeleteSession`             | Delete current session                  | n    |
| `<leader>krs` | `:KisukeResumeLastSession`         | Resume most recent session              | n    |

## Help

```vim
:help kisuke
```

If help tags aren't generated automatically, run `:helptags ALL`.

## Contributing

Issues and PRs welcome.

## License

MIT
