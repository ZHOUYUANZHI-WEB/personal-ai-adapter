# Architecture

## Product boundary

Personal AI Adapter is a user-owned protocol and local-first reference implementation. It sits between private user state, replaceable AI Agents, and external operational systems.

An **AI Lab** is one user's private instance. The Adapter framework may be public; the user's live Lab, credentials, and private operational data are not.

```text
Codex / Claude / OpenClaw / other consumers
                    |
                    v
        Personal AI Adapter Core
 Capture | Context | Handoff | External Operations
                    |
          user-owned AI Lab
                    |
                    v
       Integration Adapter boundary
                    |
                    v
 Todoist / Calendar / GitHub / Email
```

Agents and external providers are consumers or integrations. None of them is a required dependency of the Core.

## Layers

### Human Experience

Defines capture friction, decision load, interruption recovery, information density, and maintenance expectations. Architecture choices must serve the person using the system.

### User-owned state

- Inbox: unclassified and unresolved input
- Projects: active intent, direction, decisions, and recovery state
- Knowledge: reusable understanding with provenance and confidence
- Daily: chronological activity and temporary notes
- Assets: referenced source material and binary files
- Archive: inactive content excluded from default Context
- Handoffs: immutable task-transfer checkpoints

### Core protocols

- Capture and Inbox resolution
- Context Assembly
- Agent Handoff
- External Operational Systems

The Core validates contracts and manages local state. It does not provide model memory, choose the next Agent, or silently execute external operations.

### Integration adapters

Adapters translate provider-neutral operations into provider-specific API calls. Each Adapter declares authority, permissions, idempotency behavior, read/write scope, and conflict policy.

### Local runtime

Runtime contains rebuildable caches, indexes, temporary state, locks, and execution logs. It is not authoritative for Knowledge, Projects, or external operational state.

## Control flow

```text
Capture
   -> Inbox
   -> Project or Knowledge
   -> Context Bundle for one Agent and task
   -> Handoff Artifact for another Agent
   -> proposed External Action
   -> permission check
   -> provider Adapter
   -> external authority
   -> Operation Receipt
```

The final external-operation stages are protocol work for v0.4.0 and are not implemented yet.

## Context boundary

Context is assembled in this order:

1. security and system rules
2. the user's current instruction
3. Agent role and permission scope
4. current Project state
5. task-relevant Knowledge
6. necessary recent activity
7. Archive only when explicitly needed

Unrelated Projects, full chat history, Secrets, runtime logs, and the entire Knowledge base are excluded by default.

## Data invariants

1. Every durable object has a stable ID.
2. Imported information preserves provenance.
3. AI inference is distinguishable from user-confirmed content.
4. Every operational field has one declared authority.
5. Inbox resolution points to its outcome.
6. Project state remains recoverable after interruption.
7. Handoff transfers state, not conversation.
8. Secrets never enter ordinary content, Handoffs, or logs.
9. Derived data can be deleted and rebuilt.

## Dependency rule

Dependencies point inward:

```text
Provider Adapter -> Core contracts
Agent Adapter    -> Core contracts
Core             -/-> provider or Agent SDK
```

This rule keeps OpenClaw, Codex, Claude, Todoist, and future systems replaceable.
