# AGENTS.md

## Purpose

This repository contains **Mavona**, a Ruby-first Rails engineering harness for coding agents.

Mavona is itself developed with coding agents, so changes to this repository should follow the same engineering principles the product is intended to enforce:

- understand the repository before changing it;
- prefer repository evidence over assumptions;
- make the smallest useful change;
- verify independently;
- preserve existing behavior unless a change is intentional;
- avoid unnecessary abstractions and dependencies;
- do not claim verification that was not actually run.

## Authoritative documents

Before substantial implementation work, read the relevant documents.

### `SPEC-V0.1.md`

Authoritative behavior and implementation specification for Mavona `0.1.0`.

If implementing `0.1.0`, this document takes precedence over broader roadmap or vision material.

### `DECISIONS.md`

Settled architectural decisions.

Do not casually reverse these decisions during implementation. If repository evidence shows a decision is no longer workable, explain the conflict before changing architecture.

### `VISION.md`

Durable product intent and architectural principles.

Use this to resolve questions about what Mavona is trying to become, not to expand the scope of the current release.

### `ROADMAP.md`

Release sequencing, experimental gates and future milestones.

Do not implement future roadmap capabilities unless the current task explicitly authorizes them.

## Current implementation boundary

Mavona currently targets **0.1.0**.

The current unconditional implementation scope is the discovery layer:

- CLI skeleton;
- Git/repository discovery;
- default-branch detection;
- multiple Rails-root detection;
- repository instruction discovery;
- static Rails project profiling;
- component inventory;
- unified evidence representation;
- graceful static-only degradation;
- discovery performance instrumentation.

Do not pull later capabilities into this work merely because they appear useful.

Unless explicitly authorized, do not implement:

- application-code mutation;
- repair loops;
- autonomous implementation orchestration;
- impact-scoring heuristics that depend on Phase 0 findings;
- verifier-selection strategy that depends on Phase 0 findings;
- App Inspection/browser automation;
- checkpoint/rollback;
- resume;
- critique/reviewer agents;
- runtime test-impact analysis;
- cross-task memory;
- dynamic learning.

## Technology

Mavona Core is Ruby.

Prefer:

- Ruby stdlib;
- existing repository dependencies;
- Git CLI for Git operations;
- Prism where available;
- Ripper where useful;
- JSON for canonical machine-readable state;
- Markdown for human-readable artifacts.

Mavona itself is **not a Rails application**.

Do not introduce Rails as Mavona's application framework.

Do not add Node.js, TypeScript or browser automation to the Ruby core without an explicitly approved architectural change.

## Dependency discipline

New dependencies require justification.

Before adding a gem:

1. check whether Ruby stdlib already solves the problem;
2. check whether an existing dependency already provides the capability;
3. explain why the dependency is preferable to a small local implementation;
4. consider installation cost and compatibility for Rails developers.

Avoid dependencies that introduce:

- databases;
- background-job frameworks;
- generic workflow engines;
- vector databases;
- LLM provider SDKs;
- large agent frameworks;

unless a later specification explicitly requires them.

## Repository reconnaissance

Before editing:

1. inspect the repository root;
2. read the Gemfile/gemspec and lockfile;
3. inspect tests and CI;
4. inspect existing namespaces and file organization;
5. identify existing public interfaces;
6. run the relevant baseline tests;
7. check Git working-tree state.

Do not overwrite or revert pre-existing user changes.

## Branch handling

Never assume a repository uses `main` or `master`.

For repositories Mavona analyzes, branch discovery follows the rules in `DECISIONS.md`.

The branch used by the Mavona repository itself is a repository fact, not a product default.

## Implementation approach

For each substantial task:

1. summarize the requested behavior in plain language;
2. identify the narrowest public interfaces involved;
3. identify internal classes/modules likely to change;
4. identify data or persisted-state effects;
5. identify downstream callers;
6. identify risks and assumptions;
7. propose the smallest end-to-end slice;
8. identify tests/verifiers;
9. implement incrementally;
10. run verification;
11. inspect the final diff for unrelated changes.

Prefer small, comprehensible Ruby objects over speculative frameworks.

Do not introduce abstractions for hypothetical future use.

## Testing

Tests should cover public behavior and important deterministic internals.

For repository-discovery work, include fixture repositories where appropriate.

Default CI must not require:

- paid coding agents;
- external model APIs;
- network access.

When agent-backed behavior is introduced later, use:

```text
Fake adapter
Replay cassette
Live agent
```

for unit, deterministic integration and UAT/benchmark testing respectively.

## Evidence

Mavona treats evidence as structured data.

Do not silently turn missing observations into positive claims.

Executable evidence has three states:

```text
passed
failed
unknown
```

**Not run never means passed.**

Repository facts should retain provenance wherever practical.

## Static-first behavior

A target Rails repository may not boot.

Missing:

- credentials;
- database;
- Redis;
- external services;
- environment variables;

must not prevent static discovery when static evidence is sufficient.

Mark boot-dependent information `unknown` and continue where safe.

## Rails conventions

Mavona is Rails-specific but should not enforce Rails dogma.

Repository evidence outranks generic convention.

If a project consistently uses a coherent local pattern, prefer that pattern even when another Rails style is more common.

## Ruby parsing

Use real Ruby parsing when it improves correctness.

Prefer Prism where available and Ripper where useful.

Do not rely on brittle regex for structural Ruby analysis when a suitable parser is available.

## Scope discipline

Do not:

- rewrite unrelated code;
- rename unrelated public interfaces;
- change formatting across unrelated files;
- weaken tests to make work pass;
- delete failing tests without explicit authorization;
- suppress exceptions broadly to hide failures;
- add compatibility layers for hypothetical users;
- introduce future-version features into the current release.

If the task appears broader than the requested release scope, stop the expansion and report the mismatch.

## Semantic Versioning

Mavona uses Semantic Versioning.

Current target:

```text
0.1.0
```

Breaking public CLI, configuration or artifact-contract changes during `0.x` require a minor-version bump.

Do not change version numbers unless the task explicitly includes release/version work.

## Documentation

Do not allow documentation to grow by accretion.

Ownership:

- `README.md` — project introduction;
- `VISION.md` — durable intent;
- `ROADMAP.md` — sequencing and gates;
- `SPEC-V0.1.md` — current release behavior;
- `DECISIONS.md` — settled architecture;
- `AGENTS.md` — instructions for coding agents working in this repository.

If new text supersedes old text, replace the old text rather than creating competing definitions.

## Completion standard

Before claiming a task complete:

- run the relevant tests;
- report exactly which commands were run;
- report failures honestly;
- inspect the final diff;
- verify no unrelated behavior changed;
- identify assumptions;
- identify deliberately deferred work.

A successful command is evidence.

A statement that a command would probably succeed is not.