# Human Experience Principles

Architecture exists to serve the person using it. Correct data flow is not sufficient if the system demands sustained attention, frequent categorization, or daily maintenance.

These principles are designed to be attention-friendly, but they are configurable rather than assumptions about every neurodivergent user.

## Fast capture

Normal text capture should require one input and one action, ideally taking fewer than five seconds. A user must not need to choose a folder, title, tag, priority, project, or content type first.

## One default entrance

When destination is unclear, the item goes to Inbox. Classification is a later processing decision and can be suggested by an agent.

## Low decision load

An interaction should usually ask for one primary decision. Optional metadata must not block capture.

## Progressive disclosure

Default views show the current focus, current project state, and one concrete next step. History and advanced controls remain available on demand.

## Incomplete input is valid

Fragments, voice notes, untitled ideas, uncertain sources, and interrupted work are valid system states. The system preserves them without pretending they are verified Knowledge.

## Interruption recovery

Active Projects preserve a small recovery point:

```yaml
current_focus: What was being attempted
last_completed: The last verified result
next_step: The smallest useful continuation
open_questions: []
```

Returning users should not need to reread a long conversation.

## Maintenance must be optional and bounded

The system must remain useful without a mandatory daily cleanup session. Review is a recovery mechanism, not a compliance ritual. Agents may batch suggestions, but user judgment remains explicit where meaning or risk is involved.

## Gentle resurfacing

Reminders should offer continue, defer, or archive. They should avoid shame, streak penalties, persistent red states, or resurfacing an entire backlog at once.

## Configurable assistance

Users may configure information density, reminder frequency, task decomposition, review rhythm, energy labels, and whether backlog is hidden. These preferences must not become mandatory schema fields.

## Acceptance criteria

| Principle | v0.1 testable requirement |
|---|---|
| Fast capture | No classification field is required to capture text |
| Default entrance | Unrouted content becomes an Inbox item |
| Recoverability | An active Project can store a next step and recovery state |
| Low context load | Archive and unrelated Projects are excluded by default |
| Low maintenance | Unprocessed items remain safe and do not block new capture |
| Transparency | Suggested classification is distinguishable from user acceptance |

