#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { capture } from "./capture.js";
import { assembleContext } from "./context.js";
import { asHandoffPayload, createHandoff, readHandoff } from "./handoff.js";
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
    "  pai context <project-id> --agent <agent> [--task <task>] [--knowledge-limit <number>] [--lab <path>]",
    "  pai handoff create --project <project-id> --from <agent> --input <file|-> [--to <agent>] [--lab <path>]",
    "  pai handoff read <handoff-id> [--lab <path>]",
    "",
    "Environment:",
    "  PAI_LAB  Default AI Lab path (otherwise ./lab)"
  ].join("\n");
}

async function readStandardInput(): Promise<string> {
  process.stdin.setEncoding("utf8");
  let content = "";
  for await (const chunk of process.stdin) {
    content += chunk;
  }
  return content;
}

function parseJsonInput(content: string): unknown {
  return JSON.parse(content.replace(/^\uFEFF/, "")) as unknown;
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

  if (command === "context") {
    const projectId = parsed.positional[0];
    const agent = parsed.options.get("agent");
    if (!projectId) throw new Error("context requires a project ID.");
    if (!agent) throw new Error("context requires --agent.");

    const knowledgeLimitText = parsed.options.get("knowledge-limit");
    const knowledgeLimit = knowledgeLimitText === undefined ? undefined : Number(knowledgeLimitText);
    const task = parsed.options.get("task");
    const bundle = await assembleContext({
      labPath,
      projectId,
      agent,
      ...(task ? { task } : {}),
      ...(knowledgeLimit !== undefined ? { knowledgeLimit } : {})
    });
    console.log(JSON.stringify(bundle, null, 2));
    return;
  }

  if (command === "handoff") {
    const action = parsed.positional[0];

    if (action === "create") {
      const projectId = parsed.options.get("project");
      const fromAgent = parsed.options.get("from");
      const input = parsed.options.get("input");
      if (!projectId) throw new Error("handoff create requires --project.");
      if (!fromAgent) throw new Error("handoff create requires --from.");
      if (!input) throw new Error("handoff create requires --input.");

      const inputText = input === "-" ? await readStandardInput() : await fs.readFile(path.resolve(input), "utf8");
      const payload = asHandoffPayload(parseJsonInput(inputText));
      const nextAgent = parsed.options.get("to");
      const result = await createHandoff(payload, {
        labPath,
        projectId,
        fromAgent,
        ...(nextAgent ? { recommendedNextAgent: nextAgent } : {})
      });
      console.log(
        JSON.stringify(
          {
            id: result.handoff.id,
            project: result.handoff.project,
            from_agent: result.handoff.from_agent,
            recommended_next_agent: result.handoff.recommended_next_agent ?? null,
            path: result.path
          },
          null,
          2
        )
      );
      return;
    }

    if (action === "read") {
      const handoffIdValue = parsed.positional[1];
      if (!handoffIdValue) throw new Error("handoff read requires a Handoff ID.");
      console.log(JSON.stringify(await readHandoff(handoffIdValue, labPath), null, 2));
      return;
    }

    throw new Error("handoff requires create or read.");
  }

  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
