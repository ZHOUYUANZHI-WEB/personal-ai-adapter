import crypto from "node:crypto";
import { createObjectStore, type ObjectStore } from "./storage.js";
import { validateObject } from "./schema.js";
import type { HandoffArtifact, HandoffPayload, Project } from "./types.js";

export interface CreateHandoffOptions {
  labPath: string;
  projectId: string;
  fromAgent: string;
  recommendedNextAgent?: string;
  now?: Date;
  store?: ObjectStore;
}

const maximumHandoffBytes = 32 * 1024;

function assertArtifactSize(handoff: unknown): void {
  const bytes = Buffer.byteLength(JSON.stringify(handoff), "utf8");
  if (bytes > maximumHandoffBytes) {
    throw new Error(`Handoff exceeds maximum size of ${maximumHandoffBytes} bytes.`);
  }
}

function handoffId(now: Date): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `handoff-${date}-${crypto.randomUUID().slice(0, 8)}`;
}

function payloadObject(payload: unknown): Record<string, unknown> {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Handoff input must be a JSON object.");
  }
  return payload as Record<string, unknown>;
}

export async function createHandoff(
  payload: unknown,
  options: CreateHandoffOptions
): Promise<{ handoff: HandoffArtifact; path: string }> {
  if (options.fromAgent.trim().length === 0) {
    throw new Error("Producing Agent cannot be empty.");
  }

  const store = options.store ?? createObjectStore(options.labPath);
  const project = await store.read<Project>("projects", options.projectId);
  validateObject("project", project);

  if (project.id !== options.projectId) {
    throw new Error(`Project ID mismatch: requested ${options.projectId}, found ${project.id}.`);
  }

  const now = options.now ?? new Date();
  const handoff = {
    ...payloadObject(payload),
    id: handoffId(now),
    type: "handoff",
    created_at: now.toISOString(),
    from_agent: options.fromAgent,
    project: `project:${project.id}`,
    ...(options.recommendedNextAgent
      ? { recommended_next_agent: options.recommendedNextAgent }
      : {})
  };

  validateObject("handoff", handoff);
  assertArtifactSize(handoff);
  const handoffPath = await store.writeNew("handoffs", handoff.id as string, handoff);
  return { handoff: handoff as unknown as HandoffArtifact, path: handoffPath };
}

export async function readHandoff(
  handoffIdValue: string,
  labPath: string,
  store: ObjectStore = createObjectStore(labPath)
): Promise<HandoffArtifact> {
  const handoff = await store.read<HandoffArtifact>("handoffs", handoffIdValue);
  validateObject("handoff", handoff);
  assertArtifactSize(handoff);
  return handoff;
}

export function asHandoffPayload(value: unknown): HandoffPayload {
  return payloadObject(value) as unknown as HandoffPayload;
}
