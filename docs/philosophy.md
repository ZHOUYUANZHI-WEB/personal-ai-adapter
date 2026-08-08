# Philosophy

Personal AI Adapter exists to preserve personal continuity while AI Agents, tools, and providers change.

## 1. Knowledge belongs to the user

An Agent may interpret, propose, or execute, but durable Knowledge remains in user-owned, portable storage. Model memory is never the canonical source.

## 2. Agents are replaceable

Codex, Claude, GPT, OpenClaw, and future Agents are consumers of the same contracts. No Agent owns the user's identity, Project continuity, or long-term state.

## 3. Context is assembled, not remembered by Agents

An Agent receives the minimum Context required for one Project and task. Context is derived from explicit sources and can be inspected, reproduced, and discarded.

## 4. Handoff transfers state, not conversation

Agents exchange objective, current state, completed work, remaining work, Artifact references, decisions, risks, and permissions. Chat transcripts and hidden reasoning are not the protocol.

## 5. External systems retain operational authority

Todoist owns Todoist task completion and due dates. Calendar owns scheduled commitments. GitHub owns commits, pull requests, issues, and checks. The AI Lab stores references and receipts rather than competing copies of live truth.

## 6. Human attention is constrained

The system must remain usable during interruption, low energy, and incomplete thought. It should reduce decision fatigue instead of creating a maintenance obligation.

## 7. Capture is easier than organization

Uncertain input goes to one default Inbox. Title, classification, Project, priority, and tags are not capture prerequisites.

## 8. Information and Knowledge are different states

Information is captured material. Knowledge is accepted, reusable understanding with provenance, scope, and confidence. Agents must not silently promote plausible output into verified Knowledge.

## 9. Automation is permission-aware and auditable

Proposing an action is different from executing it. External writes require declared permissions, idempotency protection, and an Operation Receipt.

## 10. Derived data is rebuildable

Indexes, caches, embeddings, generated Context Bundles, and runtime state are derivatives. Losing them must not destroy the user's source data.

## Design test

When a new feature is proposed, ask:

1. Who owns this data?
2. Which system is authoritative for each field?
3. Does this make an Agent or provider harder to replace?
4. Does it increase capture or maintenance friction?
5. Can the action be inspected, authorized, retried safely, and audited?

If these questions do not have clear answers, the boundary is not ready for implementation.
