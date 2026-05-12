# Bullet MCP

[![CI](https://github.com/davebream/bullet-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/davebream/bullet-mcp/actions/workflows/ci.yml)
[![API Version Check](https://github.com/davebream/bullet-mcp/actions/workflows/api-version-check.yml/badge.svg)](https://github.com/davebream/bullet-mcp/actions/workflows/api-version-check.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

MCP server for the [Bullet](https://bullet.to) API. Manage tasks, notes, and events from Claude Desktop, Claude Code, VS Code, Cursor, or any MCP client.

Types are generated from the [OpenAPI spec](spec/openapi.json). Tool input schemas use Zod that mirrors the API contract. Registration tests verify they stay in sync. The MCP server version matches the Bullet API version.

## Tools

| Tool | Description |
|---|---|
| `list_entries` | List entries with filtering by view (`inbox`/`overdue`), period, date, status, kind, collection, or tag. Cursor pagination. |
| `create_entry` | Create a task, note, or event. Omit `start` to place in inbox. |
| `get_entry` | Get a single entry by UUID. Optionally expand collection/tags. |
| `update_entry` | Update an entry's title. |
| `delete_entry` | Soft-delete an entry. |
| `list_collections` | List all collections. Filter by archived status. |
| `get_collection` | Get a single collection by UUID. |
| `list_tags` | List all tags. Filter by archived status. |
| `get_tag` | Get a single tag by UUID. |

## Setup

### Get a Bullet API token

Go to [bullet.to](https://bullet.to) → Settings → API. Tokens start with `blt_`.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "bullet": {
      "command": "npx",
      "args": ["-y", "@davebream/bullet-mcp"],
      "env": {
        "BULLET_API_TOKEN": "blt_your_token_here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add bullet -e BULLET_API_TOKEN=blt_your_token_here -- npx -y @davebream/bullet-mcp
```

### VS Code

Open MCP config (`Ctrl+Shift+P` → "MCP: Open User Configuration"):

```json
{
  "servers": {
    "bullet": {
      "command": "npx",
      "args": ["-y", "@davebream/bullet-mcp"],
      "env": {
        "BULLET_API_TOKEN": "blt_your_token_here"
      }
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "bullet": {
      "command": "npx",
      "args": ["-y", "@davebream/bullet-mcp"],
      "env": {
        "BULLET_API_TOKEN": "blt_your_token_here"
      }
    }
  }
}
```

## Development

```bash
bun install              # install dependencies
bun run test             # run all tests
bun run lint             # biome lint + format check
bun run typecheck        # type-check
bun run build            # compile to dist/
bun run generate         # regenerate types from OpenAPI spec
```

### How it fits together

```
spec/openapi.json              ← source of truth (Bullet API contract)
  ↓ bun run generate
src/client/types.generated.ts  ← auto-generated types (don't edit)
src/client/types.ts            ← re-exports for convenience
src/client/api.ts              ← typed HTTP client
src/tools/definitions.ts       ← Zod schemas for MCP tool inputs
src/tools/entries.ts           ← pure handlers: (client, params) → string
src/tools/collections.ts
src/tools/tags.ts
src/tools/format.ts            ← pure formatters
src/index.ts                   ← MCP server wiring (only file with side effects)
```

Tool handlers are pure functions — pass in a client and params, get a string back. Tests use stub clients, no HTTP mocking.

### Git hooks

[Lefthook](https://github.com/evilmartians/lefthook) runs biome + gitleaks on commit, typecheck + tests on push:

```bash
lefthook install
```

## Debugging

Test tools interactively with [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector):

```bash
BULLET_API_TOKEN=blt_xxx npx @modelcontextprotocol/inspector node dist/index.js
```

## License

[MIT](LICENSE)
