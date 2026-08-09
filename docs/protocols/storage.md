# Storage Protocol

## Purpose

An AI Lab has exactly one writable Object Store. Storage format is an implementation choice; it must not change object identity, validation, references, or authority.

The reference implementation provides:

- `JsonFileStore` for compatibility, tests, and machine-oriented Labs
- `MarkdownVaultStore` for human-readable, Obsidian-compatible Labs

## Single-writer rule

The first initialization writes `.pai/store.json`. All later reads and writes must use the declared driver. A mismatched driver fails instead of creating a second writable representation.

When adopting a v0.1-v0.3 Lab without a manifest, initialization detects existing object files. It may adopt the matching driver, but it refuses to select another driver without an explicit migration.

JSON and Markdown may be exported as derived views in the future, but an export is never a writable authority.

## Markdown mapping

| Object collection | Vault location |
|---|---|
| Inbox | `Inbox/` |
| Projects | `Projects/` |
| Knowledge | `Knowledge/` |
| Context Profiles | `System/Context/` |
| Handoff Artifacts | `System/Handoffs/` |

Object filenames use stable IDs. Moving a file does not change its ID, although the reference Store writes to the canonical locations above.

Structured fields live in YAML Front Matter. For objects with a `content` field, that field is stored as the Markdown body and is not duplicated in Front Matter. This keeps one representation of each field inside the authoritative file.

Files beginning with `_` are human navigation notes and are excluded from object listing.

## Initialization

```bash
pai lab init --store markdown --lab "/path/to/AI Lab"
```

Initialization creates the minimum human-facing directories, `Home.md`, and starter templates. It is idempotent: existing user files are never overwritten.

The Store does not create or require `.obsidian`, Dataview, or any other Obsidian plugin configuration.

## Security

- A live private Vault stays outside the public framework repository.
- Secrets do not belong in Markdown Front Matter, note bodies, Handoffs, or runtime logs.
- Store paths validate object IDs before filesystem access.
- Atomic replacement is used when an existing object changes.
- `.pai/store.json` contains only the storage driver and format version; it contains no credentials.
