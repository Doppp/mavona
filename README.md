# Mavona

**An opinionated Ruby on Rails coding harness for AI coding agents.**

Mavona helps agents understand and safely modify real Rails codebases. It supplies repository evidence, keeps task ceremony proportional and independently verifies the resulting repository state.

```text
Understand → Change → Verify
```

Mavona spends harness complexity to reduce agent complexity. It does not try to replace the generic agent loop supplied by Codex, Claude Code, Gemini CLI, OpenCode or future agents. It adds a Rails-specific engineering layer around them.

```text
Human
  │
  ▼
Mavona
  │
  ├── repository intelligence
  ├── Rails conventions
  ├── narrow evidence packets
  ├── proportional task routing
  ├── verifier selection
  └── independent evidence
  │
  ▼
Coding agent
  │
  ▼
Rails repository
```

The goal is simple:

> Help a coding agent understand the Rails application, make the smallest complete change and prove that the change works.

## Why Mavona?

Generic coding agents can inspect files, run commands and write code, but they do not automatically know:

- which Rails conventions this repository follows;
- which routes, models, controllers, jobs or mailers are relevant;
- which associations, callbacks, migrations or schema details constrain a change;
- which nearby tests provide meaningful evidence;
- when verification should widen beyond the obvious test;
- which repository knowledge should survive the current agent conversation.

Mavona turns those Rails-specific questions into structured, reproducible harness behavior instead of a long prompt.

## Agent-facing policy

The runtime policy is deliberately brief. It tells the agent to follow local conventions, prefer standard Rails mechanisms when local evidence does not decide, make the smallest complete scoped change, use the supplied evidence and expect independent verification.

It does not repeatedly tell a capable coding agent how to inspect a codebase, write a detailed plan, enumerate classes, explain generic risks or run tests. Mechanical work belongs in the harness.

The exact current policy is defined in [`SPEC-V0.1.md`](SPEC-V0.1.md) and tested against the runtime template.

## Rails-native defaults

Mavona uses this precedence:

1. Existing application conventions.
2. Standard Rails mechanisms and the integrated Rails stack.
3. New abstractions only when justified by the task or existing architecture.

If an application uses Active Record directly, conventional controllers and models, or a simple monolithic structure, Mavona should support that design. It does not impose repository/DAO layers, service-object hierarchies, packages or generic architecture boundaries without local evidence.

## Progressive disclosure

Mavona starts with the narrowest Rails surface supported by repository evidence.

```text
likely Rails surface
        ↓
narrow evidence packet
        ↓
agent change
        ↓
independent verification
        ↓
widen only if evidence requires it
```

The component inventory is harness input, not a prompt dump. Missing dependencies or incorrect assumptions discovered during verification can widen the next evidence packet.

## Planning is proportional

Planning is not a mandatory first-class ritual.

```text
direct_change
lightweight_plan
full_plan
```

A tiny bug fix or conventional Rails change may proceed directly from understanding to change. A broad migration, multi-model feature or architectural change may warrant a lightweight or full plan. The routing decision must be backed by task and repository evidence.

Explicit `mavona plan` remains available for work that warrants or requests a plan, but it is not a prerequisite for change.

## Repository intelligence

Mavona is designed to derive evidence already present in the Rails codebase, including:

- Rails and Ruby versions;
- routes;
- models and associations;
- controllers;
- callbacks;
- jobs and mailers;
- migrations and schema;
- namespaces and autoload paths;
- project-specific abstractions;
- Minitest or RSpec conventions;
- nearby tests, fixtures or factories;
- relevant gems;
- repository instructions;
- CI, lint and security tooling;
- Git repository state and history.

Repository evidence outranks generic Rails assumptions. A coherent local pattern wins over an external style prescription.

## Independent verification

The implementation agent does not decide whether its own work is complete.

```text
Coding agent changes code
        ↓
Mavona inspects repository state
        ↓
Mavona selects and runs verifiers
        ↓
Mavona records evidence
```

An agent saying “the tests pass” is not proof that the tests passed. Executable evidence has three states:

```text
passed
failed
unknown
```

Not run never means passed. When verification confidence is low, Mavona widens rather than pretending certainty.

## Repository legibility

Mavona can surface places where a repository is difficult for agents to understand: hidden conventions, opaque entry points, undocumented jobs, expensive verification paths or important behavior known only through folklore.

Repeated ambiguity should become better documentation, a structural test, a Mavona rule or clearer repository structure—not a permanently growing agent prompt.

## Current status

Mavona is under active development. The current target is `0.1.0 — Understand`, a non-mutating Rails discovery and task-understanding foundation.

Implemented now:

- Ruby gem and CLI skeleton;
- Git and default-branch discovery;
- Rails-root detection, including safe monorepo ambiguity;
- scoped repository instruction discovery;
- static Rails project profiling;
- Rails component inventory;
- structured provenance-backed evidence;
- graceful static-only degradation;
- discovery timing;
- concise Rails-native agent policy.

Task-scoped relevance selection, proportional planning-mode classification and verifier recommendation remain gated on Phase 0 evidence. Mavona does not yet edit application code.

For the current behavior contract, see [`SPEC-V0.1.md`](SPEC-V0.1.md).

## Discovery CLI

```text
bundle exec mavona init /path/to/rails/repository
bundle exec mavona init /path/to/monorepo --rails-root apps/storefront
```

JSON is canonical output. `--format markdown` provides a human view, and `--no-boot` requests static-only discovery. A Rails boot failure never discards the static profile.

## Technology

Mavona Core is deliberately small:

```text
Ruby
Ruby gem / CLI
Git CLI
Prism / Ripper where useful
JSON + Markdown artifacts
Rails / Bundler repository inspection
Minitest
```

Mavona itself is not a Rails application. A future App Inspection capability may use a separate browser process, but the Ruby core remains independent of that technology.

## Design principles

### Repository evidence beats generic assumptions

Prefer what the target Rails application actually does.

### Spend harness complexity to reduce agent complexity

Keep intelligence mechanical and the agent-facing policy small.

### Verification is independent

Repository state and executed verifiers outrank agent narration.

### Low confidence widens

Unknown never becomes success merely because evidence is absent.

### Agent conversation is disposable

Long-term task state belongs to Mavona, not one model conversation.

### Keep the harness smaller than the problem

A harness that costs substantially more than the engineering uplift it provides is not successful.

## Development

- [`SPEC-V0.1.md`](SPEC-V0.1.md) — authoritative current behavior.
- [`DECISIONS.md`](DECISIONS.md) — settled architecture.
- [`VISION.md`](VISION.md) — durable product intent.
- [`ROADMAP.md`](ROADMAP.md) — sequencing and experimental gates.
- [`AGENTS.md`](AGENTS.md) — concise contributor instructions.

Use `mise exec` for Ruby commands. Default CI requires no paid coding agent or external model API.

## Versioning

Mavona follows Semantic Versioning.

```text
Phase 0 — research only
0.1.0   — Understand
0.2.0   — Change + Verify
0.3.0   — Repair + Safety
1.0.0   — stable autonomous-harness contracts
```

During `0.x`, breaking public CLI, configuration or artifact-contract changes require a minor version bump.
