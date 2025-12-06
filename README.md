# kisuke.vim

- `v0.3.0` restructure

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
┌─────────────────────────────────────────────────────────┐
│                  Vim Plugin Layer                       │
│  - UI & User Interaction                                │
│  - Custom JSON Protocol over stdio                      │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              TypeScript Server Core                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Vim Protocol Handler (stdio)              │  │
│  │  - Receives Vim events                            │  │
│  │  - Sends responses back to Vim                    │  │
│  └─────────────────────┬─────────────────────────────┘  │
│                        │                                │
│  ┌─────────────────────▼─────────────────────────────┐  │
│  │            Core Business Logic                    │  │
│  │  - Session Management (enhanced)                  │  │
│  │  - State Management                               │  │
│  │  - LLM Orchestration                              │  │
│  │  - Message/Context Handling                       │  │
│  └─┬───────────────────────────────────────────────┬─┘  │
│    │                                               │    │
│  ┌─▼───────────────────────┐  ┌──────────────────▼──┐  │
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
└──────────────────────────────────────────┼─────────────┘
                                           │
        ┌──────────────────────────────────┼────────────────┐
        │                                  │                │
┌───────▼──────────┐  ┌──────────────────▼─┐  ┌───────────▼────┐
│  Filesystem MCP  │  │    Git MCP         │  │  Custom MCP    │
│  (Read/Write)    │  │    (VCS ops)       │  │  Servers       │
└──────────────────┘  └────────────────────┘  └────────────────┘
```
