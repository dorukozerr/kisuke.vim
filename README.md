# kisuke.vim

> ⚠️ **This branch is primitive.** Think sticks and stones. It works, but
> barely.

A minimal Vim plugin that brings AI chat into your editor. Multi-provider
support (Anthropic, OpenAI, Google, Grok), multi-session chat, file context
marking, and code snippet selection. That's it.

## What was my plan

`feat/v0.3.0` tool calls + multi provider/model support via vercel's ai sdk,
MCP support via custom MCP client with full support of the protocol features,
and so on. While working on the improvements branch turned kisuke into egirl
goth waifu for fun :dd

[![asciicast](https://asciinema.org/a/857579.svg)](https://asciinema.org/a/857579)

## Updated Plan

1. upgrade vim client to vim9script fully
2. migrate to opencode infra
   - will add stuff partially
   - support for [ACP](https://agentclientprotocol.com/get-started/introduction)

## Installation of stick and stones state

Check [old README.md](https://github.com/dorukozerr/kisuke.vim/blob/6d97b3ef1d5c5b0c04f4b3afff0decd242707cf6/README.md)

### Note

Switching to v0.3.0 branch might create config file errors (zod schema
updates), create backup of your `~/.config/kisuke` folder maybe

License

MIT
