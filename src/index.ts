#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as store from "./store.js";
import { requireVeyra } from "./veyra.js";

const server = new Server(
  { name: "veyra-tasks", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_tasks",
      description: "List tasks, optionally filtered by status, project, or priority. FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["todo", "in_progress", "done"],
            description: "Filter by status",
          },
          project: { type: "string", description: "Filter by project name" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            description: "Filter by priority",
          },
        },
      },
    },
    {
      name: "get_task",
      description: "Retrieve a task by ID. FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The task ID" },
        },
        required: ["id"],
      },
    },
    {
      name: "create_task",
      description: "Create a new task. Requires Veyra commit mode (Class A — €0.005).",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Optional description" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            description: "Priority (default: medium)",
          },
          project: { type: "string", description: "Optional project name" },
          due: { type: "string", description: "Optional due date (ISO 8601)" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["title"],
      },
    },
    {
      name: "update_task",
      description: "Update a task's status, title, or priority. Requires Veyra commit mode (Class A — €0.005).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The task ID to update" },
          status: {
            type: "string",
            enum: ["todo", "in_progress", "done"],
            description: "New status",
          },
          title: { type: "string", description: "New title" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            description: "New priority",
          },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["id"],
      },
    },
    {
      name: "complete_task",
      description: "Mark a task as done. Requires Veyra commit mode (Class A — €0.005).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The task ID to complete" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["id"],
      },
    },
    {
      name: "delete_task",
      description: "Delete a task by ID. Requires Veyra commit mode (Class B — €0.02).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The task ID to delete" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["id"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_tasks": {
      const { status, project, priority } = args as {
        status?: string;
        project?: string;
        priority?: string;
      };
      const tasks = store.list({ status, project, priority });
      return {
        content: [{ type: "text", text: JSON.stringify({ count: tasks.length, tasks }) }],
      };
    }

    case "get_task": {
      const { id } = args as { id: string };
      const task = store.get(id);
      if (!task) {
        return {
          content: [{ type: "text", text: JSON.stringify({ found: false, id }) }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ found: true, ...task }) }],
      };
    }

    case "create_task": {
      const { title, description, priority, project, due, veyra_token } = args as {
        title: string;
        description?: string;
        priority?: store.Priority;
        project?: string;
        due?: string;
        veyra_token?: string;
      };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const task = store.create({ title, description, priority, project, due });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, commit_mode: "verified", ...task }) }],
      };
    }

    case "update_task": {
      const { id, status, title, priority, veyra_token } = args as {
        id: string;
        status?: string;
        title?: string;
        priority?: string;
        veyra_token?: string;
      };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const task = store.update(id, { status, title, priority });
      if (!task) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "TaskNotFound", id }) }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, commit_mode: "verified", ...task }) }],
      };
    }

    case "complete_task": {
      const { id, veyra_token } = args as { id: string; veyra_token?: string };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const task = store.complete(id);
      if (!task) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "TaskNotFound", id }) }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, commit_mode: "verified", ...task }) }],
      };
    }

    case "delete_task": {
      const { id, veyra_token } = args as { id: string; veyra_token?: string };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const deleted = store.del(id);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, id, deleted, commit_mode: "verified" }) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "UnknownTool", tool: name }) }],
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("veyra-tasks server error:", err);
  process.exit(1);
});
