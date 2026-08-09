import crypto from "node:crypto";
import { createObjectStore, type ObjectStore } from "./storage.js";
import { validateObject } from "./schema.js";
import type { InboxItem, SourceKind } from "./types.js";

export interface CaptureOptions {
  labPath: string;
  sourceKind?: SourceKind;
  capturedBy?: string;
  now?: Date;
  store?: ObjectStore;
}

function compactDate(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

export async function capture(content: string, options: CaptureOptions): Promise<{ item: InboxItem; path: string }> {
  if (content.trim().length === 0) {
    throw new Error("Capture content cannot be empty.");
  }

  const now = options.now ?? new Date();
  const id = `inbox-${compactDate(now)}-${crypto.randomUUID().slice(0, 8)}`;
  const item: InboxItem = {
    id,
    type: "inbox",
    created_at: now.toISOString(),
    source: {
      kind: options.sourceKind ?? "user",
      captured_by: options.capturedBy ?? "user"
    },
    status: "new",
    content: content.trim()
  };

  validateObject("inbox", item);
  const store = options.store ?? createObjectStore(options.labPath);
  const destinationPath = await store.writeNew("inbox", id, item);
  return { item, path: destinationPath };
}
