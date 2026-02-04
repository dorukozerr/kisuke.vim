# kisuke.vim

- `v0.3.0` restructure

[![asciicast](https://asciinema.org/a/778930.svg)](https://asciinema.org/a/778930)

### Updates

- basic mcp client setup is done, common mcp servers registered into clients and mcp clients tools are passed into LLM provider.
- vercel's ai sdk implementation working great, switching between any provider and model is super easy and require almost no update on code unlike the previous implementation
- session history working same as before but I plan some improvements for it to store and access detailed informations about LLM calls, tool usages inside session, I really dont know about this
- filesystem mcp server working great kisuke explores, discovers, creates, reads, and updates files in directories it has access to, mcp client that has filesystem mcp server registration has initial Roots handler setup and each time kisuke opens in new path or a path that has no access user is prompted for allowing access to file system for current path
- LLM activity tracking package added but 99% not correctly configured will turn this into configurable telemetry option

## Current Architecture

### Communication Flow

```
┌─────────────────────────────────────────┐
│           Vim Plugin                    │
│   - UI rendering in custom buffer       │
│   - User input handling                 │
│   - File path collection                │
└────────────┬────────────────────────────┘
             │ Custom JSON Protocol
             │ (stdin/stdout)
             │
┌────────────▼────────────────────────────┐
│      TypeScript Server (Node.js)        │
│   - LLM API calls (Anthropic/Google/    │
│     OpenAI/Grok)                        │
│   - Session management (JSON files)     │
│   - Message history                     │
└─────────────────────────────────────────┘
```

### Current Limitations

1. **No Write Operations**: Can only read files
2. **Limited Context**: Manual file path passing
3. **Static Functionality**: No way to extend without modifying code
4. **Basic Sessions**: Simple JSON storage, no branching/rewind
5. **LLM-only**: No tool use, just chat completions

---

## Target Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Vim Plugin Layer                      │
│  - UI & User Interaction                               │
│  - Custom JSON Protocol over stdio                     │
└───────────────────────┬────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────┐
│              TypeScript Server Core                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Vim Protocol Handler (stdio)             │  │
│  │  - Receives Vim events                           │  │
│  │  - Sends responses back to Vim                   │  │
│  └─────────────────────┬────────────────────────────┘  │
│                        │                               │
│  ┌────────────────────▼─────────────────────────────┐  │
│  │            Core Business Logic                   │  │
│  │  - Session Management (enhanced)                 │  │
│  │  - State Management                              │  │
│  │  - LLM Orchestration                             │  │
│  │  - Message/Context Handling                      │  │
│  └─┬─────────────────────────────────────────────┬──┘  │
│    │                                             │     │
│  ┌▼────────────────────────┐  ┌──────────────────▼──┐  │
│  │   MCP Server Side       │  │   MCP Client Side   │  │
│  │  (Expose Capabilities)  │  │  (Consume Tools)    │  │
│  │                         │  │                     │  │
│  │  - Session Resources    │  │  - Connect to MCP   │  │
│  │  - Session Tools        │  │    servers          │  │
│  │  - Prompt Templates     │  │  - Use their tools  │  │
│  │  - Sampling Handler     │  │  - Handle sampling  │  │
│  └─────────────────────────┘  │    requests         │  │
│                               │                     │  │
│                               └──────────┬──────────┘  │
└─────────────────────────────────────────┼──────────────┘
                                          │
        ┌─────────────────────────────────┼───────────────┐
        │                                 │               │
┌───────▼──────────┐  ┌──────────────────▼─┐  ┌───────────▼────┐
│  Filesystem MCP  │  │    Git MCP         │  │  Custom MCP    │
│  (Read/Write)    │  │    (VCS ops)       │  │  Servers       │
└──────────────────┘  └────────────────────┘  └────────────────┘
```
