import crypto from "node:crypto";
import { objectPath, readJson, writeJsonAtomic, writeJsonNew } from "./storage.js";
import { validateObject } from "./schema.js";
import type { InboxItem, KnowledgeItem, ProcessDestination, ProcessResult, Project } from "./types.js";

export interface ProcessOptions {
  labPath: string;
  to: ProcessDestination;
  title?: string;
  now?: Date;
}

function titleFrom(content: string): string {
  const firstLine = content.split(/\r?\n/, 1)[0]?.trim() ?? "Untitled";
  return firstLine.length > 72 ? `${firstLine.slice(0, 69)}...` : firstLine;
}

function newId(prefix: ProcessDestination, now: Date): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-${date}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function processInboxItem(inboxId: string, options: ProcessOptions): Promise<ProcessResult> {
  const inboxPath = objectPath(options.labPath, "inbox", inboxId);
  const inbox = await readJson<InboxItem>(inboxPath);
  validateObject("inbox", inbox);

  if (inbox.status === "resolved") {
    throw new Error(`Inbox item is already resolved: ${inboxId}`);
  }

  const now = options.now ?? new Date();
  const title = options.title?.trim() || titleFrom(inbox.content);
  const destinationId = newId(options.to, now);

  let destination: Project | KnowledgeItem;
  let collection: "projects" | "knowledge";

  if (options.to === "project") {
    collection = "projects";
    destination = {
      id: destinationId,
      type: "project",
      title,
      status: "proposed",
      objective: inbox.content,
      current_state: `Created from ${inbox.id}; scope and next action still need review.`,
      current_focus: "Clarify the project scope and choose one next action.",
      next_actions: [],
      open_questions: ["What outcome would make this project complete?"],
      blockers: [],
      decisions: [],
      knowledge_links: [],
      asset_links: [],
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    validateObject("project", destination);
  } else {
    collection = "knowledge";
    destination = {
      id: destinationId,
      type: "knowledge",
      title,
      status: "draft",
      summary: inbox.content,
      content: inbox.content,
      sources: [`inbox:${inbox.id}`],
      confidence: "uncertain",
      created_by: "agent:pai-cli",
      related_projects: [],
      related_knowledge: [],
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    validateObject("knowledge", destination);
  }

  const destinationPath = objectPath(options.labPath, collection, destinationId);
  await writeJsonNew(destinationPath, destination);

  const resolvedInbox: InboxItem = {
    ...inbox,
    status: "resolved",
    updated_at: now.toISOString(),
    resolved_to: [`${options.to}:${destinationId}`]
  };
  validateObject("inbox", resolvedInbox);
  await writeJsonAtomic(inboxPath, resolvedInbox);

  return { inbox: resolvedInbox, destination, destinationPath };
}
