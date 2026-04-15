# veyra-tasks

A persistent task manager MCP tool for AI agents, with project grouping, priorities, and status tracking. Reads are always free. Write operations require [Veyra](https://veyra.to) commit mode authorization.

## Overview

`veyra-tasks` gives AI agents a reliable task management layer backed by SQLite. Agents can freely list and inspect tasks. Creating, updating, completing, and deleting tasks is protected by Veyra commit mode — ensuring intentional, accountable writes.

## Installation

```bash
npm install
npm run build
```

Tasks are stored at `~/.veyra-tasks/data.db`, created automatically on first run.

## MCP Configuration (Claude Desktop)

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "veyra-tasks": {
      "command": "node",
      "args": ["/absolute/path/to/veyra-tasks/dist/index.js"]
    }
  }
}
```

## Tools

| Tool | Input | Class | Price |
|------|-------|-------|-------|
| `list_tasks` | `{ status?, project?, priority? }` | — | FREE |
| `get_task` | `{ id }` | — | FREE |
| `create_task` | `{ title, description?, priority?, project?, due?, veyra_token? }` | A | €0.005 |
| `update_task` | `{ id, status?, title?, priority?, veyra_token? }` | A | €0.005 |
| `complete_task` | `{ id, veyra_token? }` | A | €0.005 |
| `delete_task` | `{ id, veyra_token? }` | B | €0.02 |

### Status values
`todo` · `in_progress` · `done`

### Priority values
`low` · `medium` · `high` · `urgent`

## Examples

### Read (no token needed)

```json
// List all tasks
{ "tool": "list_tasks", "arguments": {} }

// List in-progress tasks for a project
{ "tool": "list_tasks", "arguments": { "status": "in_progress", "project": "website" } }

// List urgent tasks
{ "tool": "list_tasks", "arguments": { "priority": "urgent" } }

// Get a specific task
{ "tool": "get_task", "arguments": { "id": "1712345678-abc1234" } }
```

### Write (Veyra token required)

```json
// Create a task
{
  "tool": "create_task",
  "arguments": {
    "title": "Fix login bug",
    "description": "Users cannot log in on mobile Safari",
    "priority": "urgent",
    "project": "website",
    "due": "2025-04-20",
    "veyra_token": "vt_..."
  }
}

// Update task status
{
  "tool": "update_task",
  "arguments": {
    "id": "1712345678-abc1234",
    "status": "in_progress",
    "veyra_token": "vt_..."
  }
}

// Mark a task done
{
  "tool": "complete_task",
  "arguments": {
    "id": "1712345678-abc1234",
    "veyra_token": "vt_..."
  }
}

// Delete a task
{
  "tool": "delete_task",
  "arguments": {
    "id": "1712345678-abc1234",
    "veyra_token": "vt_..."
  }
}
```

### Error response when token is missing

```json
{
  "error": "VeyraCommitRequired",
  "message": "Write operations require Veyra commit mode.",
  "currentMode": "open",
  "requiredMode": "commit",
  "transitionStrategy": "authorize_then_retry_with_x_veyra_token",
  "provider": "veyra",
  "authorize_endpoint": "https://api.veyra.to/v1/authorize-action",
  "docs_url": "https://veyra.to"
}
```

## How Veyra Works

Veyra is a commit-mode authorization layer for AI agents. When an agent attempts a write operation:

1. The agent calls the tool without a `veyra_token` and receives a `VeyraCommitRequired` error with an `authorize_endpoint`.
2. The agent (or the user on its behalf) calls the authorize endpoint to obtain a token.
3. The agent retries the tool call with `veyra_token` set.
4. `veyra-tasks` verifies the token via `@veyrahq/sdk-node` before executing the write.

See [veyra.to](https://veyra.to) for full documentation.

## License

MIT

## Part of the Veyra Ecosystem

Veyra is commit mode for production AI agent actions.
All tools: reads free, writes require Veyra commit mode.

| Tool | Description | Install |
|------|-------------|---------|
| [veyra-memory](https://github.com/Aquariosan/veyra-memory) | Key-value memory store | `npm i -g veyra-memory` |
| [veyra-notes](https://github.com/Aquariosan/veyra-notes) | Note-taking with tags | `npm i -g veyra-notes` |
| [veyra-snippets](https://github.com/Aquariosan/veyra-snippets) | Code snippet storage | `npm i -g veyra-snippets` |
| [veyra-bookmarks](https://github.com/Aquariosan/veyra-bookmarks) | Bookmark manager | `npm i -g veyra-bookmarks` |
| [veyra-contacts](https://github.com/Aquariosan/veyra-contacts) | Contact management | `npm i -g veyra-contacts` |
| [veyra-forms](https://github.com/Aquariosan/veyra-forms) | Form builder | `npm i -g veyra-forms` |
| [veyra-webhooks](https://github.com/Aquariosan/veyra-webhooks) | Webhook sender | `npm i -g veyra-webhooks` |

**SDK:** [npm install @veyrahq/sdk-node](https://www.npmjs.com/package/@veyrahq/sdk-node)
**Website:** [veyra.to](https://veyra.to)
