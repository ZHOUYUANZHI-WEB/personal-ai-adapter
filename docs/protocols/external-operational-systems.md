# External Operational Systems Protocol

Status: design draft for v0.4.0. No provider Adapter is implemented yet.

## Purpose

This protocol connects user-owned Projects and Agent execution to real-world operational state without making the AI Lab a competing authority.

Examples of external authorities:

- Todoist for task completion, due dates, and priority
- Calendar for meetings and time commitments
- GitHub for commits, pull requests, issues, and checks
- Email providers for delivery and thread state

An Integration Adapter is not automatically authoritative. Authority belongs to the system declared for each field.

## Operation lifecycle

```text
Project or Handoff
       |
       v
Action Request
       |
 permission decision
       |
       v
Provider Adapter
       |
       v
External system
       |
       v
Operation Receipt + External Reference
```

Reading a Handoff never implicitly authorizes an external write.

## Planned protocol objects

### Action Request

Describes a proposed external operation. It includes Project, requester, provider, operation, payload, required permissions, and an idempotency key.

```yaml
id: action-request-review-pr-3
type: action_request
project: project:project-personal-ai-adapter
requested_by: agent:openclaw
provider: mock-task-provider
operation: task.create
idempotency_key: project-personal-ai-adapter:review-pr-3
required_permissions:
  - task:create
status: proposed
payload:
  content: Review PR #3
```

An Action Request is intent, not proof of execution.

### External Reference

Identifies provider-owned state without duplicating it:

```yaml
provider: todoist
resource_type: task
external_id: provider-owned-id
authority:
  - completion
  - due_date
  - priority
```

### Operation Receipt

Records an execution attempt, its result, timestamps, executor, Action Request, and resulting External Reference or error.

A Receipt is an audit object, not Knowledge.

## Permission model

The protocol separates:

1. request: an Agent proposes an operation
2. authorization: policy or user grants the exact permission and scope
3. execution: an Adapter performs the call
4. receipt: the Core records the result

Permissions must be operation-specific. Read access does not imply write access, and task creation does not imply completion or deletion permission.

## Idempotency

External writes require a stable `idempotency_key`. Re-reading one Handoff or retrying one Action Request must not create duplicate external resources.

The Core must persist the key-to-result relationship before reporting success. A Provider Adapter may use a native idempotency feature, but the provider-neutral contract cannot depend on one.

## Provider contract

v0.4.0 will define a provider-neutral task interface and a Mock Provider. The Mock Provider must validate:

- permission denial
- exactly-once behavior for one idempotency key
- safe retry after transient failure
- External Reference creation
- Operation Receipt creation
- provider authority over live task state

Todoist is deliberately deferred to v0.4.1. The Todoist Adapter must implement the stable contract rather than define it.

## Conflict behavior

When local cached state differs from provider state:

1. identify the declared authority
2. preserve timestamps and relevant evidence in the Receipt or audit record
3. update the derived local view from the authority
4. request user direction only when authority is missing, ambiguous, or unsafe to apply

## Secrets

Provider credentials belong in an OS keychain, environment variables, or dedicated Secrets manager. Configuration stores secret names and purposes, never values. Secrets must not enter Action Requests, Handoffs, Receipts, ordinary logs, or public Artifacts.

## Out of scope for v0.4.0

- Todoist API calls
- Calendar, GitHub, or Email Adapters
- autonomous approval
- payment or destructive provider operations
- cross-device synchronization
