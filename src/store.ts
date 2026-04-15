import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const DB_DIR = join(homedir(), ".veyra-tasks");
const DB_PATH = join(DB_DIR, "data.db");

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'todo',
    priority    TEXT NOT NULL DEFAULT 'medium',
    project     TEXT,
    due         TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )
`);

export type Status = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  project: string | null;
  due: string | null;
  created_at: string;
  updated_at: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function list(filters: {
  status?: string;
  project?: string;
  priority?: string;
}): Task[] {
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters.project) {
    conditions.push("project = ?");
    params.push(filters.project);
  }
  if (filters.priority) {
    conditions.push("priority = ?");
    params.push(filters.priority);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const stmt = db.prepare(
    `SELECT * FROM tasks ${where} ORDER BY updated_at DESC`
  );
  return stmt.all(...params) as Task[];
}

export function get(id: string): Task | undefined {
  const stmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
  return stmt.get(id) as Task | undefined;
}

export function create(fields: {
  title: string;
  description?: string;
  priority?: Priority;
  project?: string;
  due?: string;
}): Task {
  const now = new Date().toISOString();
  const id = generateId();
  const stmt = db.prepare(
    "INSERT INTO tasks (id, title, description, status, priority, project, due, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  stmt.run(
    id,
    fields.title,
    fields.description ?? null,
    "todo",
    fields.priority ?? "medium",
    fields.project ?? null,
    fields.due ?? null,
    now,
    now
  );
  return get(id)!;
}

export function update(
  id: string,
  fields: { status?: string; title?: string; priority?: string }
): Task | undefined {
  const existing = get(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const status = fields.status ?? existing.status;
  const title = fields.title ?? existing.title;
  const priority = fields.priority ?? existing.priority;
  const stmt = db.prepare(
    "UPDATE tasks SET status = ?, title = ?, priority = ?, updated_at = ? WHERE id = ?"
  );
  stmt.run(status, title, priority, now, id);
  return get(id)!;
}

export function complete(id: string): Task | undefined {
  return update(id, { status: "done" });
}

export function del(id: string): boolean {
  const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
