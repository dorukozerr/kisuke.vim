# kisuke.vim

A minimal AI assistant integration for Vim.

![screenshot](ss-1.png)

## About

Kisuke.vim is a simple Vim plugin designed to bring basic AI capabilities into the editor. It focuses on usability and provides a straightforward way to interact with AI models without unnecessary complexity.

## Current Features

- Multi-session chat interface within Vim
- Support for multiple AI providers and models
- Buffer menu for easy navigation and session management
- File context sharing (mark files to include in prompts)
- Code snippet selection for context
- Syntax highlighting for code blocks in the chat buffer
- Session management (create, switch, delete)

## Supported Providers and Models

Kisuke currently supports the following AI providers and models:

- **Anthropic**
  - `sonnet`
  - `haiku`
  - `opus`
- **Google**
  - `pro-2.5-exp`
  - `pro-2.5-prev`
  - `flash-2.0-exp`
  - `flash-1.5`
  - `flash-1.5-8b`
  - `pro-1.5`
- **OpenAI**
  - `gpt-4.1`
  - `gpt-4.1-mini`
  - `gpt-4o`
  - `gpt-4o-mini`
  - `gpt-4-turbo`
  - `gpt-4`
  - `gpt-3.5-turbo`

## Installation

### Prerequisites

Ensure you have `node` and `yarn` installed globally.

```bash
npm i -g yarn@latest
```

### Using Vim packages (Recommended)

```bash
mkdir -p ~/.vim/pack/plugins/start
cd ~/.vim/pack/plugins/start
git clone https://github.com/dorukozerr/kisuke.vim.git
cd kisuke.vim
yarn build
cd ~
```

### Using vim-plug

Add the following to your `.vimrc` within the `plug#begin()` and `plug#end()` block:

```vim
Plug 'dorukozerr/kisuke.vim', { 'do': 'yarn build' }
```

Then run `:PlugInstall`.

### Using Vundle

Add the following to your `.vimrc` within the Vundle plugin section:

```vim
Plugin 'dorukozerr/kisuke.vim'
```

Then run `:PluginInstall`. After installation, navigate to the plugin directory (`~/.vim/bundle/kisuke.vim` or similar) and run `yarn build`.

### Using Pathogen

```bash
cd ~/.vim/bundle
git clone https://github.com/dorukozerr/kisuke.vim.git
cd kisuke.vim
yarn build
cd ~
```

Remember to run `:helptags ALL` after installing with Pathogen or Vundle if you want access to any potential help files (though Kisuke doesn't have extensive help files currently).

## Configuration

Kisuke will prompt you for an API key the first time you use a specific provider. Configuration (provider, model, API keys) is stored in `~/.config/kisuke/config.json`. You can also manually edit this file.

To configure or change the provider and model, use the buffer menu (accessible via `<Leader>ko`) or potentially dedicated commands in the future.

## Key Mappings

Add these recommended mappings to your `.vimrc`:

```vim
" kisuke
nnoremap <Leader>ko :KisukeOpen<CR>
nnoremap <Leader>km :KisukeMarkFocusedFile<CR>
vnoremap <Leader>kh :KisukeMarkHighlighted<CR>
nnoremap <leader>krc :KisukeRemoveLastMarkedCodeBlock<CR>
nnoremap <Leader>kc :KisukeCreateNewSession<CR>
nnoremap <Leader>kd :KisukeDeleteSession<CR>
nnoremap <Leader>krs :KisukeResumeLastSession<CR>

```

| Mapping                                                        | Command                            | Description                               | Mode |
| :------------------------------------------------------------- | :--------------------------------- | :---------------------------------------- | :--- |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>o</kbd>                | `:KisukeOpen`                      | Open Kisuke chat buffer & menu            | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>m</kbd>                | `:KisukeMarkFocusedFile`           | Mark/unmark focused file for context      | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>h</kbd>                | `:KisukeMarkHighlighted`           | Mark highlighted code block for context   | `v`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>r</kbd> + <kbd>c</kbd> | `:KisukeRemoveLastMarkedCodeBlock` | Remove last added code block from context | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>c</kbd>                | `:KisukeCreateNewSession`          | Create new session                        | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>d</kbd>                | `:KisukeDeleteSession`             | Delete current session                    | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>r</kbd> + <kbd>s</kbd> | `:KisukeResumeLastSession`         | Resume the most recent session            | `n`  |

## Contributing

Feedback, suggestions, and contributions are welcome! Feel free to open issues or submit pull requests on GitHub.

## License

MIT
