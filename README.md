# kisuke.vim

A minimal AI assistant integration for Vim, inspired by modern AI-powered IDEs.

![screenshot](ss-1.png)

## About

Kisuke.vim is my first Vim plugin. I created it because I wanted to learn plugin development and bring simple AI capabilities to Vim. There are many sophisticated alternatives out there, but this plugin focuses on simplicity and usability - I just wanted something that works without being too complex.

## Current Features

- Multi-session chat interface within Vim
- File context sharing (mark files to include in your prompts)
- Claude AI integration for intelligent responses
- Simple buffer-based conversation UI
- Session management (create, switch, delete)
- Code snippet selection for context

## Planned Features

- Multiple AI providers and models support
- Enhanced file context handling
  - Instead of writing every code block or file that has been marked to session history, I plan to create a tool (that's what it's called in Anthropic API) that can read files anytime it wants to reference them. This way session history won't be bloated with marked context content.
- Configurable system commands - you can guide the AI to behave as you want

### Why I won't implement auto-applying suggestions

I do not plan to add functionality for applying suggestions/generated code blocks to files by shortcut or automatically. There are 2 reasons for this:

1. It's quite tricky to implement and I don't want to work on this right now
2. This is really a personal decision - I prefer going slow and understanding what AI suggests/generates for me. If I want to use something, I can just yank and paste it myself.

## Installation

### Prerequisites

```bash
npm i -g yarn@latest
```

### Using Vim packages

```bash
mkdir -p ~/.vim/pack/plugins/start
cd ~/.vim/pack/plugins/start
git clone https://github.com/dorukozerr/kisuke.vim.git
cd kisuke.vim
yarn build
cd ~
```

I'm working on instructions for other plugin managers - coming soon!

## Key Mappings

Add these to your .vimrc:

```vim
nnoremap <Leader>ka :KisukeConfiguration<CR>
nnoremap <Leader>ko :KisukeOpen<CR>
nnoremap <Leader>km :KisukeMarkFocusedFile<CR>
vnoremap <Leader>kh :KisukeMarkHighlighted<CR>
nnoremap <leader>krc :KisukeRemoveLastMarkedCodeBlock<CR>
nnoremap <Leader>kc :KisukeCreateNewSession<CR>
nnoremap <Leader>kn :KisukeNextSession<CR>
nnoremap <Leader>kp :KisukePreviousSession<CR>
nnoremap <Leader>kd :KisukeDeleteSession<CR>
```

| Mapping                                                        | Command                            | Description                               | Mode |
| :------------------------------------------------------------- | :--------------------------------- | :---------------------------------------- | :--- |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>o</kbd>                | `:KisukeOpen`                      | Open Kisuke chat buffer                   | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>c</kbd>                | `:KisukeCreateNewSession`          | Create new session                        | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>n</kbd>                | `:KisukeNextSession`               | Next session                              | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>p</kbd>                | `:KisukePreviousSession`           | Previous session                          | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>a</kbd>                | `:KisukeConfiguration`             | Configure API key                         | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>d</kbd>                | `:KisukeDeleteSession`             | Delete current session                    | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>m</kbd>                | `:KisukeMarkFocusedFile`           | Mark or unmark focused file for context   | `n`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>h</kbd>                | `:KisukeMarkHighlighted`           | Mark highlighted code block for context   | `v`  |
| <kbd>leader</kbd> + <kbd>k</kbd> + <kbd>r</kbd> + <kbd>c</kbd> | `:KisukeRemoveLastMarkedCodeBlock` | Remove last added code block from context | `n`  |

## Current Status

This plugin is in active development and I'm adding new features regularly. It's still in early stages but works fine for daily use. Honestly, I built it for myself first, but I hope others find it useful too!

## Contributing

Since this is my learning project, I'm very open to suggestions, feedback, and contributions. If something doesn't work or you have ideas, please feel free to open issues or submit pull requests.

## License

MIT
