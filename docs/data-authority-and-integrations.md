# Data Authority and Integrations

## Principle

An integration is not automatically an authority. Each field has exactly one authoritative system, and adapters declare how local views are produced.

## Initial authority map

| Data | Authority |
|---|---|
| Project objective, scope, rationale, direction | AI Lab Project |
| Project decisions and recovery point | AI Lab Project |
| Task completion, due date, priority | Selected task provider |
| Meetings and time commitments | Calendar provider |
| Message delivery and email thread state | Email provider |
| Commits, pull requests, issues, checks | GitHub or source repository |
| Reusable personal knowledge | AI Lab Knowledge |
| Unclassified captured material | AI Lab Inbox |

## Adapter contract

Every adapter declares:

```yaml
system: todoist
authority:
  tasks: external
  project_intent: ai_lab
read_scope: []
write_scope: []
sync_direction: bidirectional
conflict_policy:
  task_status: external_wins
offline_behavior: read_cached_view
```

Adapters should store stable external references rather than duplicate live fields. For example, a Project may contain a Todoist project ID and task references, but Todoist remains authoritative for task completion.

## Conflict behavior

When conflicting values are found:

1. Identify the declared authority for the field.
2. Preserve both source timestamps in the audit record.
3. Update the derived view from the authoritative value.
4. Ask the user only when authority is missing, ambiguous, or unsafe to apply.

## Secrets

Credentials belong in an OS keychain, environment variables, or a dedicated secrets manager. Adapter configuration may contain secret names and purposes, but never secret values.

