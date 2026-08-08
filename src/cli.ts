#!/usr/bin/env node

import path from "node:path";
import { capture } from "./capture.js";
import { processInboxItem } from "./process.js";
import type { ProcessDestination } from "./types.js";

interface ParsedArgs {
  positional: string[];
  options: Map<string, string>;
}

function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  const options = new Map<string, string>();

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token) continue;

    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const name = token.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${name}`);
    }
    options.set(name, value);
    index += 1;
  }

  return { positional, options };
}

function usage(): string {
  return [
    "Personal AI Adapter v0.1",
    "",
    "Usage:",
    "  pai capture \"<text>\" [--lab <path>]",
    "  pai process <inbox-id> --to <project|knowledge> [--title <title>] [--lab <path>]",
    "",
    "Environment:",
    "  PAI_LAB  Default AI Lab path (otherwise ./lab)"
  ].join("\n");
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help") {
    console.log(usage());
    return;
  }

  const parsed = parseArgs(rest);
  const labPath = path.resolve(parsed.options.get("lab") ?? process.env.PAI_LAB ?? "lab");

  if (command === "capture") {
    const content = parsed.positional.join(" ");
    const result = await capture(content, { labPath });
    console.log(JSON.stringify({ id: result.item.id, status: result.item.status, path: result.path }, null, 2));
    return;
  }

  if (command === "process") {
    const inboxId = parsed.positional[0];
    const to = parsed.options.get("to");
    if (!inboxId) throw new Error("process requires an inbox ID.");
    if (to !== "project" && to !== "knowledge") {
      throw new Error("--to must be project or knowledge.");
    }

    const title = parsed.options.get("title");
    const result = await processInboxItem(inboxId, {
      labPath,
      to: to as ProcessDestination,
      ...(title ? { title } : {})
    });
    console.log(
      JSON.stringify(
        {
          inbox_id: result.inbox.id,
          status: result.inbox.status,
          destination_id: result.destination.id,
          destination_type: result.destination.type,
          path: result.destinationPath
        },
        null,
        2
      )
    );
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
