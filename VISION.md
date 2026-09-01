# Mavona Vision

**Status:** Product vision  
**Date:** 1 September 2026

## Product thesis

Mavona is a **Rails engineering harness for coding agents**.

It helps supported coding agents understand Rails repositories, plan changes explicitly, implement narrowly, verify independently and leave behind auditable evidence.

The coding agent can change. The model can change. The Rails engineering discipline remains Mavona.

## Ownership boundary

### Human owns

- product intent;
- high-risk architecture decisions;
- acceptance of trade-offs;
- irreversible/data-sensitive decisions;
- final merge and deployment authority.

### Mavona owns

- Rails engineering process;
- repository understanding;
- planning structure;
- evidence;
- verifier selection;
- independent verification;
- safety/consistency guardrails.

### Coding agent owns

- implementation reasoning;
- file edits;
- tests;
- bounded repairs within Mavona constraints.

`NEEDS_DECISION` escalates from Mavona back to the human.

## Positioning

```text
Human / Team
    │
    ▼
Mavona
Rails engineering meta-harness
    │
    ├── Codex
    ├── Claude Code
    ├── Gemini CLI
    ├── OpenCode
    └── future adapters
            │
            ▼
       Rails repository
```

Mavona is not a raw LLM SDK, Codex wrapper, generic agent loop, benchmark harness, Rails application, IDE or initial cloud sandbox.

## Core invariant

Verification is independent of implementation.

```text
Agent writes code
     ↓
Mavona inspects repository state
     ↓
Mavona selects and executes verifiers
     ↓
Mavona records evidence
     ↓
pass → continue
fail → evidence-backed repair
```

Agent narration is never proof.

## Harness-engineering principles

### Repository as system of record

Durable knowledge should live in repository-accessible artifacts: code, tests, project instructions, architecture documentation, configuration and explicit task records.

Mavona should avoid giant instruction encyclopedias.

### Progressive disclosure

Mavona should compile the smallest sufficient context for the current task or phase rather than dump the repository.

### Mechanical enforcement over prose

If an important convention repeatedly causes mistakes, the preferred long-term response is an executable rule, verifier, structural test or clearer repository artifact—not an ever-longer prompt.

### Plans as first-class artifacts

Plans should make interfaces, data changes, downstream callers, implementation slices, verification, risks and unresolved decisions explicit.

### Agent legibility

Anything an agent cannot inspect effectively might as well not exist.

Mavona should surface repository-legibility problems: hidden conventions, opaque workflows, missing architecture maps, expensive verification paths and undocumented entry points.

### Feedback loops over stronger prompting

Repeated failures should produce improvements to capabilities, repository knowledge or mechanical checks.

## Repository-improvement loop

```text
Repeated failure / ambiguity
        ↓
repository-legibility finding
        ↓
docs / rule / test improvement
        ↓
repository becomes easier to engineer
        ↓
future agents improve
```

## Canonical task state

The long-term architecture should not depend on preserving one upstream agent conversation.

Mavona should maintain authoritative task state so replacement agents, replay, resume and context compilation remain possible.

## Context management

Mavona should not reimplement Codex, Claude Code or Gemini CLI's inner conversation compaction.

Its distinct responsibility is **task-context compilation**: selecting the task constraints, repository evidence, current plan, current changes and unresolved verification evidence needed for the next interaction.

## Planning philosophy

Mavona planning should have a deterministic core and may have an optional agent-enrichment layer.

The deterministic layer should discover repository facts, affected surfaces, candidate interfaces, verifier candidates and structured evidence.

Optional agent reasoning may enrich:

- summaries;
- risks;
- task decomposition;
- slice boundaries;
- ambiguous architectural trade-offs.

Mavona remains useful offline without the enrichment layer.

## Verify vs critique

Verification answers objective questions such as whether tests pass or schema behavior matches expectations.

Critique answers inferential questions such as whether a passing implementation is unnecessarily complex or inconsistent with project architecture.

Verification failure blocks completion. Critique is advisory by default and must never become an unbounded refactoring loop.

## App Inspection

A future Mavona capability should make running Rails web applications directly inspectable and usable as verification evidence.

Potential evidence includes:

- screenshots;
- DOM state;
- visible/accessibility text;
- current URL;
- console errors;
- network failures.

Native capabilities such as Codex AppShots may be used when an adapter exposes them.

The durable architectural requirement is:

> Browser/app inspection must remain outside the Ruby core behind a narrow boundary so Mavona Core is not coupled to one browser automation stack.

The exact browser technology is deliberately not decided yet.

## Technology direction

### Core

Mavona Core should be Ruby-first:

- Ruby gem / executable;
- CLI-first;
- JSON/Markdown/local artifacts initially;
- git CLI for repository state;
- Prism where available and Ripper where useful;
- Rails/Bundler/repository-native inspection.

Mavona itself should not be a Rails application.

### Browser companion

If App Inspection is validated later, implement it as a separable process behind a narrow protocol. TypeScript + Playwright is a strong current candidate, not a committed dependency.

## Persistent product risks

### Verifier explosion

Widening verification can make Mavona too slow or expensive. Verification breadth must be balanced against runtime/cost.

### Rails dogma

Rails-specific intelligence must defer to strong repository evidence. Mavona should not punish legitimate project-specific architecture merely because it differs from common Rails style.

### False confidence

Incomplete discovery can create misleading certainty. Unknown and low-confidence states must remain explicit.

### Harness overhead

If Mavona consumes materially more time/cost than the uplift it creates, the architecture should be reduced.

## Versioning

Mavona software releases follow **Semantic Versioning**.

Roadmap milestones correspond to actual release lines:

```text
Phase 0  — research only; no software release
0.1.0    — Plan
0.2.0    — Implement + Verify
0.3.0    — Repair + Safety
1.0.0    — stable autonomous-harness contracts
```

Within `0.x`, public contracts may still evolve, but breaking public CLI/config/artifact contract changes **require** a minor-version bump.

Patch releases are reserved for backward-compatible fixes within a release line.

## North-star claim

Mavona should eventually earn, rather than assume, a claim like:

> Across multiple coding agents and held-out Rails tasks, Mavona increases independently verified completion while reducing regressions and human repair effort at acceptable cost overhead.

The claim must be demonstrated through protected grading and held-out evaluation.


## Documentation ownership

To prevent specification accretion:

- `VISION.md` owns durable product intent and architectural principles.
- `ROADMAP.md` owns sequencing, release gates and experiment phases.
- `SPEC-V0.1.md` owns 0.1.0 behavior, formulas, thresholds, schemas and acceptance criteria.
- `DECISIONS.md` owns settled architectural decisions.

If a detail belongs to another document, reference it rather than restating it.
