# Personal AI Adapter

> A user-owned context layer for interchangeable AI agents.

Personal AI Adapter gives Codex, Claude, GPT, OpenClaw, and other agents a shared way to understand your context, knowledge, projects, and workflows—without making any agent the owner of your long-term state.

## Why

AI agents are replaceable. Your identity, knowledge, and project continuity are not.

Today, useful context is often trapped in chat history, copied into oversized prompts, or split across tools with conflicting state. Personal AI Adapter defines a portable layer between the user and their agents:

```text
User-owned data and rules
          │
          ▼
Personal AI Adapter
          │
          ├── Codex
          ├── Claude
          ├── GPT
          └── Other agents
```

## Core ideas

- Knowledge belongs to the user, not the agent.
- Capture first; organize later.
- Context is assembled per task and kept intentionally small.
- Projects preserve intent, decisions, and current direction.
- Operational systems remain authoritative for their own state.
- Agents exchange structured handoffs instead of chat histories.
- The system must remain usable when attention and energy are limited.

## Product and instance

Personal AI Adapter is the reusable framework. An **AI Lab** is one user's private instance of it.

```text
Personal AI Adapter (public framework)
               │
               ▼
       Your AI Lab (private data)
```

This repository contains schemas, specifications, and sanitized examples. It must not contain a user's live vault, credentials, or private operational data.

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│ Human Experience                                         │
│ Fast capture · low decision load · interruption recovery │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│ User-owned layer                                         │
│ Inbox · Projects · Knowledge · Daily · Assets · Archive  │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│ Adapter control layer                                    │
│ Context · Agent rules · Policies · Data contracts        │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│ Integrations and external operational systems            │
│ Todoist · Calendar · Email · GitHub                       │
└──────────────────────────────────────────────────────────┘
```

Start with the [Philosophy](docs/philosophy.md), then see the [Architecture](docs/architecture.md) and [Data Model](docs/data-model.md).

## The first workflow

The initial implementation focuses on one complete loop:

```text
Capture → Inbox → Process → Project or Knowledge
```

1. Capture accepts incomplete input without requiring classification.
2. Inbox preserves the original content and provenance.
3. Processing proposes a destination instead of forcing an immediate decision.
4. Project stores intent and direction; Knowledge stores reusable understanding.

## Quick Start

Requires Node.js 20 or newer.

```bash
npm install
npm run build
npm link
```

Create a plugin-free Markdown Vault that can be opened directly in Obsidian:

```bash
pai lab init --store markdown --lab "/path/to/Your AI Lab"
```

The command creates the human-facing folders, `Home.md`, and starter templates without overwriting existing files. The Vault stays independent of Obsidian and does not require Dataview or another community plugin.

Confirm the installed CLI version:

```bash
pai --version
```

Capture incomplete text without choosing a destination:

```bash
pai capture "Maybe let agents share structured state instead of chat history" --store markdown --lab "/path/to/Your AI Lab"
```

The command returns a stable Inbox ID. Resolve it later:

```bash
pai process <inbox-id> --to project
pai process <inbox-id> --to knowledge --title "Structured agent handoff"
```

Assemble the minimum context for a Project and Agent:

```bash
pai context <project-id> --agent codex
```

Only the requested Project, matching Context Profiles, and explicitly linked Knowledge are included. See the [Context Assembly Protocol](docs/protocols/context-assembly.md) for selection and exclusion rules.

Create an immutable Agent Handoff without copying chat history:

```bash
pai handoff create \
  --project project-personal-ai-adapter \
  --from agent:codex \
  --to agent:openclaw \
  --input examples/handoff-input.json \
  --lab examples/demo-lab
```

Read and validate it for the receiving Agent:

```bash
pai handoff read <handoff-id> --lab examples/demo-lab
```

See the [Agent Handoff Protocol](docs/protocols/agent-handoff.md) for producer, consumer, required-field, Project association, transcript-exclusion, and security rules.

By default, data is written as JSON to `./lab`. Set `PAI_LAB` or pass `--lab <path>` to use another AI Lab directory. Set `PAI_STORE=markdown` or pass `--store markdown` for a Markdown Vault.

Each Lab records one writable Store in `.pai/store.json`. JSON and Markdown cannot silently become competing truth sources. See the [Storage Protocol](docs/protocols/storage.md).

Run the automated checks with:

```bash
npm test
```

## Data authority

One field has one authority:

| State | Authority |
|---|---|
| Project goal, rationale, direction, decisions | AI Lab Project |
| Task completion, due date, priority | Todoist or selected task provider |
| Time commitments and meetings | Calendar |
| Email delivery and thread state | Email provider |
| Commits, pull requests, issues, checks | GitHub or code repository |
| Reusable personal knowledge | AI Lab Knowledge |

Adapters may produce local views, but they must not create competing truth.

The [External Operational Systems Protocol](docs/protocols/external-operational-systems.md) defines the planned permission, idempotency, and receipt boundary before any Todoist integration is added.

## Repository map

```text
docs/       Philosophy, architecture, data model, and protocols
schemas/    Portable JSON Schema contracts
examples/   Sanitized example AI Lab data
src/        Local-first reference implementation
```

## Project status

**Experimental / v0.3.1 protocol baseline.** Capture, Context Assembly, Agent Handoff, and Markdown Vault storage are implemented. External operations remain a design draft.

Current milestone:

- [x] Product boundary
- [x] Human Experience principles
- [x] Data authority model
- [x] Initial schemas
- [x] Local-first capture CLI
- [x] Inbox processing loop
- [x] Minimal context assembler
- [x] Structured agent handoff demo
- [x] Single-authority Markdown Vault Store
- [x] Plugin-free Obsidian-compatible Lab initialization
- [ ] External Operational Systems v0.4.0 contracts
- [ ] Mock Provider with permission and idempotency tests
- [ ] Todoist Adapter, deferred to v0.4.1

See the [Roadmap](docs/roadmap.md) for release milestones.

## Security

- Keep personal AI Lab instances outside this public repository.
- Store credentials in environment variables or an OS keychain.
- Treat external documents, email, and web content as untrusted data.
- Require explicit authorization for destructive or externally visible actions.
- Keep indexes, caches, and embeddings rebuildable from user-owned source files.

## Contributing

The project is currently in architecture-freeze and schema-validation work. Discussion should focus on concrete workflows, data authority, portability, accessibility, and security rather than adding new top-level modules.

## License

A license will be selected before the first public release.
