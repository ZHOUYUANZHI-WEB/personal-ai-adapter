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

For the complete design, see [Architecture Specification](docs/architecture-specification.md).

## The first workflow

The initial implementation focuses on one complete loop:

```text
Capture → Inbox → Process → Project or Knowledge
```

1. Capture accepts incomplete input without requiring classification.
2. Inbox preserves the original content and provenance.
3. Processing proposes a destination instead of forcing an immediate decision.
4. Project stores intent and direction; Knowledge stores reusable understanding.

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

## Repository map

```text
docs/       Design specifications
schemas/    Portable JSON Schema contracts
examples/   Sanitized example AI Lab data
src/        Future reference implementation
```

## Project status

**Experimental / pre-v0.1.** The architecture and first schema contracts are being stabilized before the reference implementation is built.

Current milestone:

- [x] Product boundary
- [x] Human Experience principles
- [x] Data authority model
- [x] Initial schemas
- [ ] Local-first capture CLI
- [ ] Inbox processing loop
- [ ] Minimal context assembler
- [ ] Structured agent handoff demo
- [ ] Todoist adapter

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

