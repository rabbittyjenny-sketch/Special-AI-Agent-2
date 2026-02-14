# MCP Servers for Special AI Agent

This directory contains Model Context Protocol (MCP) servers that extend the capabilities of our AI agents.

## Available Servers

### 1. Chat History Server (`chat-history-server.js`)

Stores and retrieves chat conversations for AI agents.

**Tools:**
- `save_message` - Save a chat message to history
- `get_session_history` - Retrieve chat history for a session
- `search_conversations` - Search conversations by content

**Data Storage:**
- Location: `../data/chat-history.json`
- Format: JSON

### 2. Filesystem Server (`filesystem-server.js`)

Provides secure file read/write capabilities.

**Tools:**
- `read_file` - Read file contents
- `write_file` - Write content to a file
- `list_directory` - List files in a directory
- `search_files` - Search for files by pattern

**Security:**
- Restricted to allowed directories only
- Configurable via `ALLOWED_DIRECTORIES` env variable

## Configuration

MCP servers are configured in `.claude/mcp_settings.json`:

```json
{
  "mcpServers": {
    "chat-history": {
      "command": "node",
      "args": ["./mcp-servers/chat-history-server.js"]
    },
    "filesystem": {
      "command": "node",
      "args": ["./mcp-servers/filesystem-server.js"],
      "env": {
        "ALLOWED_DIRECTORIES": "./backend,./mcp-servers"
      }
    }
  }
}
```

## Usage

### Running Manually

```bash
# Chat History Server
node mcp-servers/chat-history-server.js

# Filesystem Server
ALLOWED_DIRECTORIES="./backend,./mcp-servers" node mcp-servers/filesystem-server.js
```

### Integration with AI Agents

The MCP servers automatically integrate with Claude Code when properly configured in `.claude/mcp_settings.json`.

## Development

### Adding New Tools

1. Edit the respective server file
2. Add tool definition in `ListToolsRequestSchema` handler
3. Implement tool logic in `CallToolRequestSchema` handler
4. Test using the MCP inspector or manual testing

### Testing

```bash
# Test chat history server
npm run test:mcp-chat

# Test filesystem server
npm run test:mcp-fs
```

## Architecture

```
┌─────────────────┐
│   AI Agent      │
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Client     │
│  (SDK)          │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌──────────┐
│ Chat   │  │Filesystem│
│History │  │ Server   │
│Server  │  │          │
└────────┘  └──────────┘
```

## Data Persistence

### Chat History
- Stored in: `/data/chat-history.json`
- Format:
```json
{
  "sessions": {
    "session_id": {
      "id": "session_id",
      "agentType": "code-specialist",
      "createdAt": "2025-01-01T00:00:00Z",
      "messages": [...]
    }
  }
}
```

## Security Considerations

1. **Filesystem Access**: Limited to allowed directories only
2. **Input Validation**: All inputs are validated before processing
3. **Error Handling**: Errors are caught and returned safely
4. **No Remote Access**: Servers only accept local stdio connections

## Future Enhancements

- [ ] Add database MCP server (PostgreSQL/Neon)
- [ ] Add web search MCP server
- [ ] Add code execution sandbox
- [ ] Add image generation integration
- [ ] Add email/notification capabilities
- [ ] Add analytics tracking
- [ ] Add GitHub integration

## License

MIT License - See parent project LICENSE file
