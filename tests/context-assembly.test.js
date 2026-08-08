import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assembleContext } from "../dist/context.js";

async function temporaryLab() {
  return fs.mkdtemp(path.join(os.tmpdir(), "pai-context-test-"));
}

async function writeObject(labPath, collection, id, value) {
  const directory = path.join(labPath, collection);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, `${id}.json`), `${JSON.stringify(value, null, 2)}\n`);
}

const timestamp = "2026-08-08T13:00:00.000Z";

function project() {
  return {
    id: "project-demo",
    type: "project",
    title: "Demo project",
    status: "active",
    objective: "Demonstrate minimal context assembly.",
    current_state: "The Project and Context Profiles exist.",
    next_actions: ["Assemble a Context Bundle"],
    knowledge_links: ["knowledge:knowledge-handoff", "knowledge:knowledge-missing"],
    created_at: timestamp,
    updated_at: timestamp
  };
}

function profile(id, appliesTo, target, priority) {
  return {
    id,
    type: "context",
    applies_to: appliesTo,
    ...(target ? { target } : {}),
    priority,
    instructions: [`instruction from ${id}`],
    constraints: [],
    prohibited_actions: [],
    updated_at: timestamp
  };
}

function knowledge() {
  return {
    id: "knowledge-handoff",
    type: "knowledge",
    title: "Structured handoff",
    status: "verified",
    summary: "Agents exchange structured state rather than chat history.",
    content: "Use objective, current state, completed work, remaining work, risks, and permissions.",
    sources: ["user:design-decision"],
    confidence: "confirmed",
    created_by: "user",
    created_at: timestamp,
    updated_at: timestamp
  };
}

test("assembles only matching Context Profiles and linked Knowledge", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  await writeObject(labPath, "projects", "project-demo", project());
  await writeObject(labPath, "knowledge", "knowledge-handoff", knowledge());
  await writeObject(labPath, "context", "context-global", profile("context-global", "global", undefined, 10));
  await writeObject(labPath, "context", "context-codex", profile("context-codex", "agent", "codex", 30));
  await writeObject(labPath, "context", "context-project", profile("context-project", "project", "project-demo", 20));
  await writeObject(labPath, "context", "context-claude", profile("context-claude", "agent", "claude", 100));

  const bundle = await assembleContext({
    labPath,
    projectId: "project-demo",
    agent: "codex",
    now: new Date(timestamp)
  });

  assert.deepEqual(
    bundle.profiles.map((item) => item.id),
    ["context-codex", "context-project", "context-global"]
  );
  assert.deepEqual(bundle.knowledge.map((item) => item.id), ["knowledge-handoff"]);
  assert.match(bundle.warnings[0], /knowledge-missing/);
  assert.ok(bundle.estimated_tokens > 0);
  assert.ok(bundle.excluded_by_default.includes("chat_history"));
  assert.ok(bundle.excluded_by_default.includes("secrets"));
});

test("task Context is included only when the requested task matches", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  await writeObject(labPath, "projects", "project-demo", { ...project(), knowledge_links: [] });
  await writeObject(labPath, "context", "context-task", profile("context-task", "task", "write-tests", 50));

  const withoutTask = await assembleContext({ labPath, projectId: "project-demo", agent: "codex" });
  const withTask = await assembleContext({
    labPath,
    projectId: "project-demo",
    agent: "codex",
    task: "write-tests"
  });

  assert.equal(withoutTask.profiles.length, 0);
  assert.deepEqual(withTask.profiles.map((item) => item.id), ["context-task"]);
});

test("knowledge limit bounds linked Knowledge loaded into context", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  await writeObject(labPath, "projects", "project-demo", project());
  await writeObject(labPath, "knowledge", "knowledge-handoff", knowledge());

  const bundle = await assembleContext({
    labPath,
    projectId: "project-demo",
    agent: "codex",
    knowledgeLimit: 0
  });

  assert.equal(bundle.knowledge.length, 0);
  assert.match(bundle.warnings[0], /excluded by knowledge limit 0/);
});

test("token estimate does not undercount non-ASCII context as ASCII", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  await writeObject(labPath, "projects", "project-demo", {
    ...project(),
    objective: "为注意力有限的用户生成最小上下文。",
    knowledge_links: []
  });

  const bundle = await assembleContext({ labPath, projectId: "project-demo", agent: "codex" });
  assert.ok(bundle.estimated_tokens > JSON.stringify(bundle).length / 4);
});
