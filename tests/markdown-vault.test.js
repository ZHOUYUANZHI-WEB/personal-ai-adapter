import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { capture } from "../dist/capture.js";
import { assembleContext } from "../dist/context.js";
import { createHandoff, readHandoff } from "../dist/handoff.js";
import { initializeLab } from "../dist/lab.js";
import { processInboxItem } from "../dist/process.js";
import { JsonFileStore, MarkdownVaultStore } from "../dist/storage.js";

async function temporaryLab() {
  return fs.mkdtemp(path.join(os.tmpdir(), "pai-markdown-test-"));
}

const timestamp = "2026-08-09T10:00:00.000Z";

test("Markdown Vault Store runs Capture and Process without a JSON mirror", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));
  const store = new MarkdownVaultStore(labPath);

  const captured = await capture("Agents share state, not transcripts.", {
    labPath,
    store,
    now: new Date(timestamp)
  });
  assert.equal(path.extname(captured.path), ".md");
  assert.equal(path.basename(path.dirname(captured.path)), "Inbox");
  assert.equal((await store.read("inbox", captured.item.id)).content, captured.item.content);

  const rawInbox = await fs.readFile(captured.path, "utf8");
  assert.match(rawInbox, /^---\n/);
  assert.match(rawInbox, /Agents share state, not transcripts\./);
  await assert.rejects(fs.access(path.join(labPath, "inbox", `${captured.item.id}.json`)));

  const processed = await processInboxItem(captured.item.id, {
    labPath,
    store,
    to: "project",
    now: new Date("2026-08-09T10:01:00.000Z")
  });
  assert.equal(path.basename(path.dirname(processed.destinationPath)), "Projects");
  assert.equal((await store.read("inbox", captured.item.id)).status, "resolved");
});

test("Context and Handoff consume the same Markdown authority", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));
  const store = new MarkdownVaultStore(labPath);

  const project = {
    id: "project-vault",
    type: "project",
    title: "Markdown Vault",
    status: "active",
    objective: "Use one human-readable authority.",
    current_state: "The Markdown Store is under test.",
    next_actions: ["Assemble context"],
    knowledge_links: ["knowledge:knowledge-vault"],
    created_at: timestamp,
    updated_at: timestamp
  };
  const knowledge = {
    id: "knowledge-vault",
    type: "knowledge",
    title: "Single authority",
    status: "verified",
    summary: "One Lab has one writable Store.",
    content: "Markdown is the authority for this Lab; JSON is not a writable mirror.",
    sources: ["user:decision"],
    confidence: "confirmed",
    created_by: "user",
    created_at: timestamp,
    updated_at: timestamp
  };
  const profile = {
    id: "context-global",
    type: "context",
    applies_to: "global",
    priority: 10,
    instructions: ["Keep context small."],
    constraints: [],
    prohibited_actions: ["Do not copy chat history."],
    updated_at: timestamp
  };

  await store.writeNew("projects", project.id, project);
  await store.writeNew("knowledge", knowledge.id, knowledge);
  await store.writeNew("context", profile.id, profile);

  const bundle = await assembleContext({
    labPath,
    store,
    projectId: project.id,
    agent: "codex",
    now: new Date(timestamp)
  });
  assert.deepEqual(bundle.knowledge.map((item) => item.id), [knowledge.id]);
  assert.deepEqual(bundle.profiles.map((item) => item.id), [profile.id]);

  const created = await createHandoff(
    {
      objective: project.objective,
      current_state: project.current_state,
      completed: ["Validated Markdown Context Assembly"],
      remaining: ["Review the Vault"],
      artifacts: [`project:${project.id}`],
      decisions: ["Do not create a JSON mirror"],
      risks: [],
      required_permissions: ["read:vault"]
    },
    {
      labPath,
      store,
      projectId: project.id,
      fromAgent: "agent:codex",
      now: new Date(timestamp)
    }
  );
  assert.match(created.path, /System[\\/]Handoffs/);
  assert.deepEqual(await readHandoff(created.handoff.id, labPath, store), created.handoff);
});

test("Store manifest prevents two writable authorities", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));
  await new MarkdownVaultStore(labPath).initialize();

  await assert.rejects(new JsonFileStore(labPath).initialize(), /locked to the markdown Store/);
});

test("unmanaged legacy objects cannot be silently forked into another Store", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));
  await fs.mkdir(path.join(labPath, "projects"), { recursive: true });
  await fs.writeFile(path.join(labPath, "projects", "project-legacy.json"), "{}\n", "utf8");

  await assert.rejects(
    new MarkdownVaultStore(labPath).initialize(),
    /already contains json objects/
  );
  await new JsonFileStore(labPath).initialize();
});

test("Markdown Lab initialization is idempotent and preserves user files", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  const first = await initializeLab({ labPath, driver: "markdown" });
  assert.ok(first.created.includes("Home.md"));
  await fs.writeFile(path.join(labPath, "Home.md"), "# My Home\n", "utf8");

  const second = await initializeLab({ labPath, driver: "markdown" });
  assert.deepEqual(second.created, []);
  assert.equal(await fs.readFile(path.join(labPath, "Home.md"), "utf8"), "# My Home\n");
  await fs.access(path.join(labPath, "System", "Context"));
  await fs.access(path.join(labPath, "Templates", "Daily.md"));
});
