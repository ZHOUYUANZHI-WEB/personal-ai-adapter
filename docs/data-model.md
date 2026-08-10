# Data Model

## Object families

| Object | Purpose | Authority | Durable |
|---|---|---|---|
| Inbox Item | Preserve unresolved input | AI Lab Inbox | Yes |
| Project | Preserve intent, direction, decisions, and recovery state | AI Lab Project | Yes |
| Knowledge Item | Preserve accepted reusable understanding | AI Lab Knowledge | Yes |
| Context Profile | Declare scoped instructions and constraints | AI Lab Context | Yes |
| Context Bundle | Assemble minimum Context for one task | Derived from source objects | No |
| Handoff Artifact | Transfer point-in-time task state | Immutable user-owned Artifact | Yes |
| Action Request | Propose an external operation | Requesting user or Agent | Yes, planned v0.4.0 |
| External Reference | Identify provider-owned state | External provider | Yes, planned v0.4.0 |
| Operation Receipt | Record an attempted external operation | Execution/audit layer | Yes, planned v0.4.0 |
| Runtime Record | Record execution diagnostics | Local runtime | Policy-dependent |

## Common fields

Durable objects use stable IDs, explicit types, timestamps, source references, and actor identifiers where applicable. Object IDs do not change when files move.

```yaml
id: stable-id
type: object-type
created_at: RFC-3339 timestamp
updated_at: RFC-3339 timestamp
```

AI-produced content records its producer and confidence. `confirmed`, `inferred`, and `uncertain` must remain distinguishable.

## References

Relationships use explicit typed references:

```text
project:project-personal-ai-adapter
knowledge:knowledge-user-owned-state
handoff:handoff-20260808-abcd1234
```

A reference does not transfer authority. A local Todoist reference may identify a task, but Todoist remains authoritative for its live completion state.

## Project

Project is authoritative for:

- objective and scope
- current overall state
- direction and next meaningful outcome
- decisions and recovery point
- links to relevant Knowledge and external systems

Project is not authoritative for provider-owned task completion, Calendar commitments, GitHub checks, or email delivery state.

## Knowledge

Knowledge is reusable content with:

- summary and content
- provenance
- scope
- confidence
- creation and review timestamps
- relationships to Projects and other Knowledge

Knowledge does not contain temporary task state, raw runtime logs, Secrets, or unmarked Agent inference.

## Context Bundle

Context Bundle embeds one requested Project, matching Context Profiles, and bounded explicitly linked Knowledge. It reports included sources, default exclusions, warnings, and an estimated token size.

It is generated for use and can be discarded.

## Handoff Artifact

Handoff requires one Project reference and contains only continuation state. It is append-only, bounded, and validated with `additionalProperties: false` to reject transcript fields.

## Authority map

| Field or state | Authority |
|---|---|
| Project objective, rationale, direction | AI Lab Project |
| Reusable personal Knowledge | AI Lab Knowledge |
| Task completion, due date, priority | Selected task provider |
| Time commitments and meetings | Calendar provider |
| Email delivery and thread state | Email provider |
| Commits, pull requests, issues, checks | GitHub or source repository |

One field must not have two writable authorities.

## Storage

The reference implementation supports validated JSON files and a Markdown Vault Store using YAML Front Matter. Each AI Lab declares exactly one writable Store in `.pai/store.json`; selecting another driver fails rather than creating a competing truth.

In the Markdown Store, structured fields live in Front Matter and the `content` field, when present, lives in the Markdown body. Indexes, caches, exports, and alternate views remain derived.

See the [Storage Protocol](protocols/storage.md) for path mapping, initialization, and compatibility rules.
