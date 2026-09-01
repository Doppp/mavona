# Mavona Documentation

Canonical documents:

- `VISION.md` — durable product thesis, ownership boundaries, risks and long-term architecture.
- `ROADMAP.md` — sequencing, Phase 0 gates and SemVer release roadmap.
- `SPEC-V0.1.md` — authoritative implementation specification for Mavona `0.1.0`.
- `DECISIONS.md` — settled architectural decisions.

Semantic Versioning:

```text
Phase 0 — research only
0.1.0   — Plan
0.2.0   — Implement + Verify
0.3.0   — Repair + Safety
1.0.0   — stable autonomous-harness contracts
```

The archived monolithic PRD is research history, not an implementation instruction.

Documentation ownership:

- ROADMAP owns sequencing and gates.
- SPEC owns behavior, formulas, thresholds, schemas and acceptance criteria.
- DECISIONS owns settled architectural choices.
- VISION owns durable product intent and principles.

When new material supersedes old material, replace it instead of adding a competing definition.

## Discovery CLI

The unconditional Mavona 0.1.0 discovery slice is available as a Ruby gem executable:

```text
bundle exec mavona init /path/to/rails/repository
bundle exec mavona init /path/to/monorepo --rails-root apps/storefront
```

JSON is the canonical output. `--format markdown` provides a human-readable view, and `--no-boot` requests static-only discovery. Rails boot failure never discards the static project profile. Planning remains explicitly deferred until the Phase 0 findings inform its strategy.
