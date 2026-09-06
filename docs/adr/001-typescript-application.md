# ADR 001 — TypeScript application with a narrow Ruby bridge

**Status:** Accepted product architecture
**Decision:** TypeScript 7 strict, Bun and OpenTUI/Solid; Ruby for bounded target-language inspection

## Context

Mavona specializes in Rails but needs polished terminal interaction, provider-neutral streaming, local models and durable task execution. The user chose TypeScript after considering Ruby TUI maturity and the cost of building a renderer. Language specialization belongs in facts, tools and verification, not an all-Ruby implementation requirement.

## Alternatives

- All-Ruby application with Tuile: closer to the target language, but did not satisfy the user's confidence in UI dependencies and would require more UI integration work.
- Ruby core with a TypeScript frontend over a local protocol: viable transition option, but duplicates runtime/lifecycle integration across the main UI-agent path. Rejected for this clean-slate target, not as inherently unsound.
- Rust/Ratatui or Go/Bubble Tea: credible native designs, but not the selected interaction stack and would require different application components.
- TypeScript/OpenTUI core and frontend: selected for one application language and direct use of the chosen UI stack. Native renderer and browser assets still require packaging evidence.

## Consequences

Keep UI state separate from authoritative domain state despite a shared process. Do not port a terminal framework. Ruby remains a controlled subprocess; choose no-boot parser placement by measurement, not language ideology. Preserve accepted v1 behavior through differential fixtures, not a mechanical class port. Treatment evaluation informs improvements and performance claims without blocking delivery of Rails evidence features. No claim that TypeScript alone improves task completion.

## Pending measured decisions

Add separate ADRs after spikes for parser choice, exact OpenTUI/Solid/Bun compatibility, compiler-API tooling, SQLite integration and Playwright driver packaging. Record actual platforms, timings and failures. This document contains no invented spike results. Revisit only with evidence that the selected architecture fails a required gate.
