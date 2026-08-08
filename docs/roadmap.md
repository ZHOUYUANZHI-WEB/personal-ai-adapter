# Roadmap

## Completed foundations

### v0.1 - Local-first capture

- Capture without mandatory classification
- Inbox resolution into Project or Knowledge
- JSON Schema validation
- sanitized example AI Lab

### v0.2 - Context Assembly

- minimum Context by Agent, Project, and optional task
- explicit included sources and default exclusions
- multilingual-aware token estimate
- bounded linked Knowledge

### v0.3 - Agent Handoff

- immutable Project-linked Handoff Artifact
- provider-neutral create/read commands
- required state, Artifact, decision, risk, and permission fields
- transcript exclusion and total size bound

## Next

### v0.4.0 - External Operational Systems protocol

- Action Request Schema
- External Reference Schema
- Operation Receipt Schema
- provider-neutral task contract
- Mock Provider
- explicit permission checks
- idempotency and safe retry behavior

No real external provider is required for v0.4.0.

### v0.4.1 - Todoist Adapter

- credential references without stored secret values
- task create/read/complete through the stable provider contract
- authority-aware state reads
- operation receipts and failure handling
- dry-run and explicit authorization

## Later

- Calendar, GitHub, and Email Adapters
- Markdown Vault Store and optional Obsidian interface
- rebuildable semantic retrieval
- Knowledge deduplication and contradiction detection
- optional graphical capture interface
- controlled automation under explicit policies

Knowledge graphs, autonomous Agent negotiation, mandatory cloud storage, and provider-specific Core dependencies remain out of scope until simpler contracts demonstrate a real need.
