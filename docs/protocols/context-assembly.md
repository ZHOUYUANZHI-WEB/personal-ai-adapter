# Context Assembly Protocol

Status: implemented in v0.2

Context is generated for a specific Project, Agent, and optional task. It is a temporary bundle, not another long-term knowledge store.

## Command

```bash
pai context <project-id> --agent <agent> [--task <task>] [--knowledge-limit <number>]
```

## Included by default

1. The requested Project
2. Global Context Profiles
3. Context Profiles matching the Agent
4. Context Profiles matching the Project
5. Context Profiles matching the optional task
6. Knowledge explicitly linked by the Project, bounded by `--knowledge-limit`

Profiles are ordered by descending priority. Their original boundaries are preserved so an Agent can identify the source of every instruction and detect conflicts rather than receiving an opaque merged prompt.

## Excluded by default

- Inbox
- Daily history
- Archive
- Unrelated Projects
- Unlinked Knowledge
- Chat history
- Runtime logs
- Secrets

The Context Bundle reports every included source, default exclusion category, load warning, and a conservative token estimate based on serialized size. The estimate treats non-ASCII content more cautiously so Chinese and other multilingual context is not measured with an English-only character ratio.

## Target matching

Context Profile targets accept either a raw ID or an explicit reference:

```yaml
applies_to: agent
target: codex
```

```yaml
applies_to: project
target: project:project-personal-ai-adapter
```

Task Context is included only when the caller passes the matching `--task` value.
