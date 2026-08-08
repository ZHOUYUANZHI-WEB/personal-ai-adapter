import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createHandoff, readHandoff } from "../dist/handoff.js";

async function temporaryLab() {
  return fs.mkdtemp(path.join(os.tmpdir(), "pai-handoff-test-"));
}

async function writeProject(labPath) {
  const directory = path.join(labPath, "projects");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    path.join(directory, "project-demo.json"),
    `${JSON.stringify({
      id: "project-demo",
      type: "project",
      title: "Demo project",
      status: "active",
      objective: "Demonstrate Agent handoff.",
      current_state: "Agent A completed the first stage.",
      next_actions: ["Hand work to Agent B"],
      created_at: "2026-08-08T13:00:00.000Z",
      updated_at: "2026-08-08T13:00:00.000Z"
    }, null, 2)}\n`
  );
}

function payload() {
  return {
    objective: "Continue the Agent Handoff implementation.",
    current_state: "Schema and create command are complete.",
    completed: ["Defined required fields"],
    remaining: ["Review the read command"],
    artifacts: ["file:src/handoff.ts"],
    decisions: ["Do not transfer chat history"],
    risks: ["Receiving Agent may lack file access"],
    required_permissions: ["read:repository"]
  };
}

test("creates and reads a Project-linked immutable Handoff Artifact", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));
  await writeProject(labPath);

  const created = await createHandoff(payload(), {
    labPath,
    projectId: "project-demo",
    fromAgent: "agent:codex",
    recommendedNextAgent: "agent:openclaw",
    now: new Date("2026-08-08T14:00:00.000Z")
  });

  assert.equal(created.handoff.project, "project:project-demo");
  assert.equal(created.handoff.from_agent, "agent:codex");
  assert.equal(created.handoff.recommended_next_agent, "agent:openclaw");
  assert.deepEqual(await readHandoff(created.handoff.id, labPath), created.handoff);
});

test("rejects chat history and every other undeclared field", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));
  await writeProject(labPath);

  await assert.rejects(
    createHandoff({ ...payload(), chat_history: ["full conversation"] }, {
      labPath,
      projectId: "project-demo",
      fromAgent: "agent:codex"
    }),
    /Invalid handoff/
  );
});

test("requires the referenced Project to exist and match its filename ID", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  await assert.rejects(
    createHandoff(payload(), {
      labPath,
      projectId: "project-missing",
      fromAgent: "agent:codex"
    }),
    /ENOENT/
  );
});

test("requires all state and safety fields", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));
  await writeProject(labPath);

  const incomplete = { ...payload() };
  delete incomplete.required_permissions;

  await assert.rejects(
    createHandoff(incomplete, {
      labPath,
      projectId: "project-demo",
      fromAgent: "agent:codex"
    }),
    /Invalid handoff/
  );
});

test("rejects transcript-shaped payloads that exceed the Artifact size limit", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));
  await writeProject(labPath);

  await assert.rejects(
    createHandoff({
      ...payload(),
      decisions: Array.from({ length: 40 }, (_, index) => `${index}:${"x".repeat(1000)}`)
    }, {
      labPath,
      projectId: "project-demo",
      fromAgent: "agent:codex"
    }),
    /maximum size/
  );
});
