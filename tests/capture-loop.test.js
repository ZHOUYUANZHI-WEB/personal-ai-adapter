import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { capture } from "../dist/capture.js";
import { processInboxItem } from "../dist/process.js";

async function temporaryLab() {
  return fs.mkdtemp(path.join(os.tmpdir(), "pai-test-"));
}

test("capture stores incomplete text in Inbox without classification", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  const result = await capture("maybe connect this to the project later", {
    labPath,
    now: new Date("2026-08-08T10:00:00.000Z")
  });

  const stored = JSON.parse(await fs.readFile(result.path, "utf8"));
  assert.equal(stored.status, "new");
  assert.equal(stored.content, "maybe connect this to the project later");
  assert.equal("title" in stored, false);
  assert.equal("suggested_destination" in stored, false);
});

test("process resolves an Inbox item into a proposed Project", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  const captured = await capture("Build a low-friction capture command", { labPath });
  const result = await processInboxItem(captured.item.id, {
    labPath,
    to: "project",
    now: new Date("2026-08-08T11:00:00.000Z")
  });

  assert.equal(result.destination.type, "project");
  assert.equal(result.destination.status, "proposed");
  assert.equal(result.inbox.status, "resolved");
  assert.deepEqual(result.inbox.resolved_to, [`project:${result.destination.id}`]);
  await fs.access(result.destinationPath);
});

test("process resolves an Inbox item into a draft Knowledge item", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  const captured = await capture("Agents should share structured state, not chat history", { labPath });
  const result = await processInboxItem(captured.item.id, {
    labPath,
    to: "knowledge",
    title: "Structured agent handoff",
    now: new Date("2026-08-08T12:00:00.000Z")
  });

  assert.equal(result.destination.type, "knowledge");
  assert.equal(result.destination.status, "draft");
  assert.equal(result.destination.title, "Structured agent handoff");
  assert.deepEqual(result.destination.sources, [`inbox:${captured.item.id}`]);
  assert.equal(result.inbox.status, "resolved");
});

test("an already resolved Inbox item cannot be processed twice", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  const captured = await capture("One destination only", { labPath });
  await processInboxItem(captured.item.id, { labPath, to: "knowledge" });

  await assert.rejects(
    processInboxItem(captured.item.id, { labPath, to: "project" }),
    /already resolved/
  );
});

test("process rejects object IDs that could escape the Inbox directory", async (context) => {
  const labPath = await temporaryLab();
  context.after(() => fs.rm(labPath, { recursive: true, force: true }));

  await assert.rejects(
    processInboxItem("../../private-file", { labPath, to: "knowledge" }),
    /Invalid object ID/
  );
});
