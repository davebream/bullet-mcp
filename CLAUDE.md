# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An MCP (Model Context Protocol) server wrapping the [Bullet API](https://api.bullet.to/docs) — a task/note/event manager with collections and tags. The MCP server version is kept 1:1 with the API version defined in `spec/openapi.json`.

## Commands

```bash
bun install              # Install dependencies
bun run build            # Compile TypeScript → dist/
bun run test             # Run all tests (vitest)
bun run test:watch       # Run tests in watch mode
bun run typecheck        # Type-check without emitting
bun run lint             # Biome lint + format check
bun run lint:fix         # Auto-fix lint/format issues
bun run generate         # Regenerate types from OpenAPI spec
```

Run a single test file: `bunx vitest run tests/client/api.test.ts`
Run tests matching a name: `bunx vitest run -t "listEntries"`

## Architecture

### Spec-First, TDD Workflow

1. `spec/openapi.json` — **single source of truth** for the Bullet API contract
2. `bun run generate` → `src/client/types.generated.ts` (auto-generated, never hand-edit)
3. `src/client/types.ts` — ergonomic re-exports from the generated types
4. Tests are written before implementation; tests in `tests/server/registration.test.ts` verify that MCP tool definitions stay aligned with the OpenAPI spec (enums, required fields, parameter names)

### Functional Core / Imperative Shell

- **Pure tool handlers** (`src/tools/entries.ts`, `collections.ts`, `tags.ts`): `(client, params) → string`. No MCP awareness, no I/O beyond the injected client. Trivially testable with stub clients.
- **Formatting** (`src/tools/format.ts`): Pure functions that render domain objects to text.
- **Zod schemas** (`src/tools/definitions.ts`): Define MCP tool input schemas with Zod, mirroring the OpenAPI spec. Also exports `TOOL_DEFINITIONS` (JSON Schema form) used by registration tests.
- **Server shell** (`src/index.ts`): Wires Zod schemas + handlers into `McpServer.registerTool()`. Reads `BULLET_API_TOKEN` from env. This is the only file with side effects.

### API Client

`src/client/api.ts` — thin HTTP client (`BulletClient`) using `fetch`. Handles auth headers, query param serialization (including array params as repeated keys), and error wrapping via `BulletApiError`.

## Key Conventions

- **Types flow from spec**: modify `spec/openapi.json` → run `bun run generate` → update Zod schemas in `definitions.ts` if needed. Never hand-edit `types.generated.ts`.
- **Tool handlers are pure**: they take a `BulletClient` and params, return a string. Tests use stub clients, no HTTP mocking needed.
- **MCP version = API version**: both read from `spec.info.version`. Bump the spec version when the API changes.
- **Biome** for linting and formatting (tabs, recommended rules).

## Git Hooks (lefthook)

Pre-commit runs biome lint and gitleaks secrets scan. Pre-push runs typecheck and tests. Install with `lefthook install` after cloning.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): lint, typecheck, test, secrets scan, and generated-types-in-sync check on every push/PR to main.
- **API version check** (`.github/workflows/api-version-check.yml`): daily cron fetches `https://api.bullet.to/docs/openapi.json`, compares version against `spec/openapi.json`. Opens a GitHub issue with `api-update` label if upstream version is newer.

## Environment

- `BULLET_API_TOKEN` — required. Bearer token with `blt_` prefix.

## Running the Server

```bash
BULLET_API_TOKEN=blt_xxx bun run start
```

Or configure in Claude Desktop / Claude Code settings:
```json
{
  "mcpServers": {
    "bullet": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": { "BULLET_API_TOKEN": "blt_xxx" }
    }
  }
}
```
