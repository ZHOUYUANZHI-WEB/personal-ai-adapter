# Architecture Specification

## 1. Philosophy

Personal AI Adapter separates durable user state from replaceable agent execution.

1. Knowledge belongs to the user.
2. Agents execute; they do not own long-term knowledge.
3. Context tells an agent how to help with the current task.
4. Projects preserve active intent, direction, decisions, and recovery state.
5. Information and Knowledge are different lifecycle stages.
6. Capture must happen before organization is required.
7. Context pollution and token use should be minimized by default.
8. Source files are canonical; indexes and embeddings are derived.
9. Open, portable formats are preferred over model-specific memory.

## 2. System boundary

The product has two distinct concepts:

- **Personal AI Adapter:** schemas, policies, context assembly, handoff protocol, and integration contracts.
- **AI Lab:** a private user instance containing personal context, projects, knowledge, and integration configuration.

The framework may be public. A real AI Lab is private unless its owner deliberately publishes selected content.

## 3. Logical layers

### Human Experience layer

Defines capture friction, decision load, recovery behavior, information density, and maintenance expectations. Architecture choices must satisfy these requirements.

### User-owned data layer

- Inbox: unclassified and unresolved input.
- Projects: objectives, scope, direction, decisions, blockers, and recovery points.
- Knowledge: accepted or clearly marked reusable understanding.
- Daily: chronological activity and temporary notes.
- Assets: referenced binary material.
- Archive: inactive content excluded from default context.

### Control layer

- Context rules
- Agent roles and permissions
- Security policies
- Data contracts
- Authority mappings

### Integration layer

Adapters translate between the AI Lab and external operational systems. They declare read scope, write scope, authority, sync direction, and conflict policy.

### Local runtime

Runtime contains rebuildable caches, indexes, temporary state, locks, and execution logs. It is not a truth source for user knowledge or external operational state.

## 4. Context assembly

Context is assembled in this order:

1. Security and system rules
2. The user's current instruction
3. Agent role and permission scope
4. Current Project state
5. Task-relevant Knowledge
6. Necessary recent activity
7. Archive only when explicitly needed

The default context excludes unrelated projects, the full knowledge base, old daily notes, full chat history, secrets, caches, and verbose execution logs.

## 5. Agent handoff

Agents exchange structured state rather than transcripts. A handoff records:

- objective
- current state
- completed work
- remaining work
- artifacts
- decisions
- risks
- required permissions
- recommended next agent

Conversation history may be consulted when necessary, but it is never the durable handoff contract.

## 6. Data invariants

1. Every durable object has a stable ID.
2. Every imported object preserves provenance.
3. AI inference is distinguishable from user-confirmed content.
4. The authority for a field is explicit.
5. Resolution of an Inbox item points to its outcome.
6. Project state remains recoverable after interruption.
7. Secrets never enter ordinary content or logs.
8. Derived data can be deleted and rebuilt.

## 7. v0.1 scope

The first implementation supports the smallest closed loop:

```text
Capture → Inbox → Process → Project or Knowledge
```

Todoist, semantic retrieval, autonomous multi-agent orchestration, a knowledge graph, and a graphical interface are intentionally outside the first implementation milestone.

