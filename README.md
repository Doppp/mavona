# Mavona

**Rails engineering infrastructure for coding agents.**

Mavona is a Ruby-first harness that helps coding agents work on Ruby on Rails repositories with more discipline and less guesswork.

It sits above tools such as Codex, Claude Code, Gemini CLI and OpenCode. Those tools provide the generic coding-agent loop: models, shell access, file editing, sessions and tools. Mavona adds the Rails-specific engineering layer around them.

```text
Human
  │
  ▼
Mavona
  │
  ├── repository intelligence
  ├── Rails conventions
  ├── implementation planning
  ├── verifier selection
  ├── independent verification
  └── evidence and reporting
  │
  ▼
Codex / Claude Code / Gemini / other agents
  │
  ▼
Rails repository
```

The goal is simple:

> Help a coding agent understand the Rails application, make the smallest correct change and prove that the change works.

## Why Mavona?

Modern coding agents are increasingly capable, but most of their engineering workflow is still generic.

They can inspect files, run commands and write code, but they do not automatically know:

- which Rails conventions this repository actually follows;
- which files and downstream callers a change is likely to affect;
- which tests provide meaningful evidence for that change;
- when verification should widen beyond the obvious unit test;
- whether a migration, callback or test modification introduces risk;
- which repository knowledge should be preserved for the next agent invocation.

Mavona exists to make those Rails-specific engineering decisions explicit and reproducible.

## The core idea

Mavona separates **implementation** from **verification**.

```text
Coding agent implements
        ↓
Mavona inspects the change
        ↓
Mavona chooses the required evidence
        ↓
Mavona runs verification independently
        ↓
pass → continue
fail → structured evidence back to the agent
```

An agent saying “the tests pass” is not proof that the tests passed.

Mavona records the evidence itself.

## Rails-specific, agent-independent

Mavona is not tied to a particular coding agent or model.

The architecture is intended to support adapters for tools such as:

```text
Codex
Claude Code
Gemini CLI
OpenCode
future coding agents
```

The durable part of Mavona is not the model interface.

It is the Rails engineering knowledge around the agent.

## Repository intelligence

Mavona is designed to understand Rails repositories through evidence already present in the codebase.

That includes:

- Rails application structure;
- routes;
- models and associations;
- controllers;
- jobs;
- mailers;
- migrations and schema;
- services and project-specific abstractions;
- Minitest or RSpec conventions;
- fixtures or factories;
- Bundler configuration;
- Git history;
- repository instructions such as `AGENTS.md`;
- CI, lint and security tooling.

Mavona prefers repository evidence over generic Rails assumptions.

If a project consistently does something differently from conventional Rails style, the repository wins.

## Repository legibility

A good coding-agent environment is not only about prompts.

Mavona is also intended to identify places where a repository itself is difficult for agents to understand.

For example:

```text
Recurring jobs are configured in a custom initializer,
but no architecture document or integration test points to it.
```

That can become a **repository-legibility finding**.

Over time, recurring failures can be converted into better documentation, structural tests or Mavona rules so future agents do not need to rediscover the same lesson.

## Planning

Mavona planning is deterministic-first.

```text
Repository discovery
        ↓
Rails analysis
        ↓
evidence-backed plan skeleton
        │
        ├── usable offline
        │
        ▼
optional agent enrichment
```

The deterministic layer is responsible for repository facts and likely affected surfaces.

An optional coding-agent pass may later enrich higher-level reasoning such as risks or task decomposition.

Mavona should remain useful even without a model call.

## Verification

Verifier selection is one of Mavona's central research areas.

Instead of simply running the closest test file, Mavona can use signals such as:

- Rails naming conventions;
- constant and reference relationships;
- routes and callers;
- model associations;
- test structure;
- Git co-change history.

When verification confidence is low, Mavona widens verification rather than pretending certainty.

```text
focused test
    ↓
related tests
    ↓
component tests
    ↓
broader relevant suite
```

Under-verification is considered more dangerous than a modest amount of extra test runtime.

## Current status

Mavona is under active development.

The current implementation target is the non-mutating discovery and planning foundation for `0.1.0`.

The first release focuses on:

- Git and repository discovery;
- default-branch detection;
- Rails root detection;
- static Rails profiling;
- repository instruction discovery;
- component inventory;
- structured evidence;
- implementation planning.

It does **not** yet edit application code.

For the current implementation contract, see [`SPEC-V0.1.md`](SPEC-V0.1.md).

## Technology

Mavona Core is written in **Ruby**.

The initial stack is deliberately small:

```text
Ruby
Ruby gem / CLI
Git CLI
Prism / Ripper
JSON + Markdown task artifacts
Rails / Bundler repository inspection
Minitest unless the repository establishes otherwise
```

Mavona itself is not a Rails application.

A future App Inspection capability may use a separate browser automation process, but the Ruby core will remain independent of that technology.

## App Inspection

Longer term, Mavona may expose the running Rails application itself as verification evidence.

Potential evidence includes:

- screenshots;
- DOM state;
- visible text;
- accessibility state;
- browser console errors;
- failed network requests.

Agent-native capabilities such as Codex AppShots may also be used when available.

The goal is not simply to attach screenshots to prompts.

The goal is to make application behavior independently inspectable and verifiable.

## Design principles

### Repository evidence beats generic assumptions

Prefer what this Rails application actually does.

### Verification is independent

The implementation agent does not decide whether its own work is complete.

### Not run never means passed

Executable evidence has three states:

```text
passed
failed
unknown
```

### Low confidence widens

When Mavona cannot confidently identify sufficient verification, it runs or recommends more, not less.

### Agent conversation is disposable

Long-term task state belongs to Mavona, not one model conversation.

### Important conventions become mechanical

Repeated prose instructions should eventually become executable rules, tests or repository structure where practical.

### Keep the harness smaller than the problem

A harness that costs substantially more than the engineering uplift it provides is not successful.

## Development

The authoritative implementation specification for the current release is:

[`SPEC-V0.1.md`](SPEC-V0.1.md)

Settled architectural decisions are recorded in:

[`DECISIONS.md`](DECISIONS.md)

The broader product thesis lives in:

[`VISION.md`](VISION.md)

Future sequencing and release gates live in:

[`ROADMAP.md`](ROADMAP.md)

Coding agents working in this repository should also read:

[`AGENTS.md`](AGENTS.md)

## Documentation map

```text
README.md
    ↓
What Mavona is and where to start

AGENTS.md
    ↓
How coding agents should work in this repository

SPEC-V0.1.md
    ↓
Exact implementation contract for 0.1.0

DECISIONS.md
    ↓
Settled architectural decisions

VISION.md
    ↓
Why Mavona exists

ROADMAP.md
    ↓
Future sequencing and gates
```

Coding agents implementing `0.1.0` should treat `SPEC-V0.1.md` as authoritative for release behavior.

## Versioning

Mavona uses Semantic Versioning.

During the `0.x` series, breaking public CLI, configuration or artifact-contract changes require a minor version bump.

Examples:

```text
0.1.0 → 0.1.1
backward-compatible bug fix

0.1.x → 0.2.0
new public capability or breaking pre-1.0 contract change
```

## Project philosophy

Coding agents are becoming increasingly good at writing code.

The harder problem is building an environment in which they can reliably do software engineering.

Mavona is an attempt to make that environment unusually good for Ruby on Rails.