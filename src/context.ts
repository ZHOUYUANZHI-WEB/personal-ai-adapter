import crypto from "node:crypto";
import path from "node:path";
import { listJsonFiles, objectPath, readJson } from "./storage.js";
import { validateObject } from "./schema.js";
import type { ContextBundle, ContextProfile, KnowledgeItem, Project } from "./types.js";

export interface AssembleContextOptions {
  labPath: string;
  projectId: string;
  agent: string;
  task?: string;
  knowledgeLimit?: number;
  now?: Date;
}

function targetMatches(profile: ContextProfile, options: AssembleContextOptions): boolean {
  switch (profile.applies_to) {
    case "global":
      return true;
    case "agent":
      return profile.target === options.agent || profile.target === `agent:${options.agent}`;
    case "project":
      return profile.target === options.projectId || profile.target === `project:${options.projectId}`;
    case "task":
      return Boolean(options.task) && (profile.target === options.task || profile.target === `task:${options.task}`);
  }
}

function knowledgeId(reference: string): string | undefined {
  const id = reference.startsWith("knowledge:") ? reference.slice("knowledge:".length) : reference;
  return /^[a-z0-9][a-z0-9._:-]*$/.test(id) ? id : undefined;
}

function bundleId(now: Date): string {
  const date = now.toISOString().replaceAll(/[-:.TZ]/g, "").slice(0, 14);
  return `context-bundle-${date}-${crypto.randomUUID().slice(0, 8)}`;
}

function estimateTokens(value: unknown): number {
  const serialized = JSON.stringify(value);
  let asciiCharacters = 0;
  let nonAsciiCodePoints = 0;

  for (const character of serialized) {
    if (character.codePointAt(0)! <= 0x7f) {
      asciiCharacters += 1;
    } else {
      nonAsciiCodePoints += 1;
    }
  }

  return Math.ceil(asciiCharacters / 4 + nonAsciiCodePoints * 2);
}

export async function assembleContext(options: AssembleContextOptions): Promise<ContextBundle> {
  if (options.agent.trim().length === 0) {
    throw new Error("Agent cannot be empty.");
  }

  const knowledgeLimit = options.knowledgeLimit ?? 5;
  if (!Number.isInteger(knowledgeLimit) || knowledgeLimit < 0) {
    throw new Error("Knowledge limit must be a non-negative integer.");
  }

  const projectPath = objectPath(options.labPath, "projects", options.projectId);
  const project = await readJson<Project>(projectPath);
  validateObject("project", project);

  const profiles: ContextProfile[] = [];
  for (const profilePath of await listJsonFiles(options.labPath, "context")) {
    const profile = await readJson<ContextProfile>(profilePath);
    validateObject("context", profile);
    if (targetMatches(profile, options)) {
      profiles.push(profile);
    }
  }
  profiles.sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));

  const knowledge: KnowledgeItem[] = [];
  const warnings: string[] = [];
  const requestedKnowledge = project.knowledge_links ?? [];

  for (const reference of requestedKnowledge.slice(0, knowledgeLimit)) {
    const id = knowledgeId(reference);
    if (!id) {
      warnings.push(`Ignored invalid Knowledge reference: ${reference}`);
      continue;
    }

    const itemPath = objectPath(options.labPath, "knowledge", id);
    try {
      const item = await readJson<KnowledgeItem>(itemPath);
      validateObject("knowledge", item);
      knowledge.push(item);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Could not load knowledge:${id}: ${message}`);
    }
  }

  if (requestedKnowledge.length > knowledgeLimit) {
    warnings.push(
      `${requestedKnowledge.length - knowledgeLimit} linked Knowledge item(s) excluded by knowledge limit ${knowledgeLimit}.`
    );
  }

  const now = options.now ?? new Date();
  const includedSources = [
    `project:${project.id}`,
    ...profiles.map((profile) => `context:${profile.id}`),
    ...knowledge.map((item) => `knowledge:${item.id}`)
  ];

  const bundle: ContextBundle = {
    id: bundleId(now),
    type: "context_bundle",
    created_at: now.toISOString(),
    agent: options.agent,
    ...(options.task ? { task: options.task } : {}),
    project,
    profiles,
    knowledge,
    included_sources: includedSources,
    excluded_by_default: [
      "inbox",
      "daily",
      "archive",
      "unrelated_projects",
      "unlinked_knowledge",
      "chat_history",
      "runtime_logs",
      "secrets"
    ],
    warnings,
    estimated_tokens: 0
  };
  bundle.estimated_tokens = estimateTokens(bundle);
  validateObject("context-bundle", bundle);
  return bundle;
}
