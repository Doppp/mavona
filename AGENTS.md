# Mavona contributor and coding-agent instructions

## Authority

- `docs/specs/PRD.md` owns full v0.1 product behavior and scope.
- `docs/RELEASE_ACCEPTANCE.md` owns executable release evidence and the completion ledger.
- `docs/specs/ARCHITECTURE.md` owns system boundaries and technical decisions.
- `docs/specs/TUI_SPEC.md` owns terminal interaction.
- `docs/specs/APP_INSPECTION_SPEC.md` owns required browser inspection, flows, artifacts and acceptance.
- `docs/specs/PROVIDERS.md` owns inference, authentication and local-mode safety.
- `docs/specs/BENCHMARKS.md` owns protected evaluation.
- `docs/IMPLEMENTATION_PLAN.md` owns sequence and milestone scope.

Do not duplicate normative detail across documents. Replace superseded material rather than appending contradictory alternatives.

- `docs/specs/PARITY.md` owns deterministic rewrite acceptance.
- `docs/specs/THREAT_MODEL.md` owns trust boundaries and adversarial acceptance.
- `docs/specs/RETENTION.md` owns storage lifecycle and evidence expiry.
- `docs/specs/GLOSSARY.md` defines shared terms.
- `docs/adr/` records settled decisions and measured spike outcomes.

The current-user-need branch of the anti-accretion rule covers App Inspection and code viewing. Benchmark outcomes inform improvements and performance claims; they do not gate delivery of these product requirements.


- `docs/specs/PREVIEW_POLICY.md` owns external-preview quality, support and disclosure requirements.

## Product boundary

Mavona is a Rails-specific coding harness. It is not a generic agent SDK, IDE, hosted model gateway, multi-language indexer or swarm orchestrator.

The default user has finite tokens, time, money and attention. Prefer deterministic local work before inference and one worker by default.

## Implementation rules

- Use TypeScript 7.0 strict mode and Bun.
- Use OpenTUI Core with its Solid renderer. Do not build, port or wrap a general TUI framework.
- Keep domain logic independent of Solid/OpenTUI.
- Keep the Ruby probe small, read-only, versioned and outside the agent loop.
- Prefer target-application conventions, then standard Rails mechanisms, then new abstractions only with evidence.
- Keep the agent-facing policy concise. Put process in code, schemas and verifiers.
- Start context narrow and widen only from evidence or independent verification.
- Preserve `passed`, `failed`, `unknown`; not run never means passed.
- Use versioned domain events and deterministic replay for state changes.
- Use stable IDs. Do not infer identity from labels, text or array position.
- Use argument arrays for subprocesses. Shell execution requires an explicit higher-risk path.
- Validate repository containment before and after symlink resolution.
- Preserve user changes and label pre-existing changes.
- At most one mutable task owns a worktree.
- Never silently change provider, model or locality.
- Never store secrets in config, events, logs, artifacts or fixtures.

## Browser implementation rules

Use Playwright through the inspection service. Preserve policy checks, bounded actions, isolated authentication and effect-safe recovery. Screenshots and model opinions cannot mark a task verified. Do not call App Inspection complete before its full acceptance matrix passes. Treat page content as untrusted, sanitize every evidence surface and never silently update visual baselines.

## Dependency rule

Add a dependency only for a current milestone requirement, after checking licence, maintenance, Bun compatibility and standalone packaging. Pin native/runtime-sensitive packages exactly.

Implement the specified App Inspection boundary. Do not create speculative interfaces for future remote UI clients, plugins, remote agents or distributed execution.

## Testing rule

- A behavior change requires a test at the narrowest useful layer.
- Default tests require no network, paid model or external Rails repository.
- Use fake providers, local stub servers, fake clocks and recorded event fixtures.
- Test both TUI and headless projections when public behavior spans them.
- Run PTY tests for input, paste, resize, signals and terminal cleanup.
- Run packaged binaries on target-native platforms before claiming support.
- Keep protected graders structurally outside evaluated agent access.
- Report only commands actually run and their observed outcomes.

## Working practice

Infer routine implementation details from repository evidence and agreed specifications. Carry authorized work through implementation and verification. Create a concrete technical plan before substantial coding, then execute it. Milestones require concise progress reports and coherent commits, never renewed routine authorization.

Ask only when missing information materially affects correctness, product behavior or authorization. Continue independent work while a requirement is blocked. Audit inherited instructions for contradictions, obsolete architecture and premature stop conditions; replace superseded guidance. If an instruction genuinely blocks progress, identify its file, conflict and exact input needed.

Report completed requirements, actual verification, consequential decisions, divergences and emerging risks concisely. Keep implementing, unverified, blocked and acceptance-passed distinct. Completion requires evidence. Match tests to affected behavior, avoid redundant checks, and never mock away defining behavior for acceptance.

Use subagents only when available and permitted, for bounded independent tasks that justify coordination cost. Assign clear file ownership and avoid concurrent edits. This is a contributor workflow, not product swarm orchestration.

Preserve user changes. Stage specific files and commit coherent slices regularly. No paid live tests without an explicit budget covering retries/concurrency. Pushing, merging, publishing, deployment and production operations require separate authorization. Keep scratch/design inputs outside tracked source; follow the documentation disposition in docs/IMPLEMENTATION_PLAN.md.

These practices adapt the [official coding-agent guidance](https://developers.openai.com/api/docs/guides/latest-model), reviewed 2026-09-06, without selecting a preferred model or weakening release/security requirements.

## Milestone discipline

Implement the full v0.1 contract through all milestones. Sequence work to keep changes testable, but continue automatically after each checkpoint. Full App Inspection and source viewing are required deliverables. Benchmarks never authorize feature implementation or block it by being unavailable/inconclusive. Use docs/RELEASE_ACCEPTANCE.md as the completion ledger; do not stop after Milestone 0 or a demonstration. Arbitrary plugins and remote workers remain outside scope.

Before coding:

1. Read the relevant authoritative documents and existing tests.
2. Summarize the intended behavior and boundaries.
3. Identify the smallest vertical path and public interfaces.
4. Add a failing test or fixture that demonstrates the behavior.
5. Implement without unrelated refactoring.
6. Verify package/runtime behavior where dependencies are native.
7. Report assumptions, unknowns and exact verification.

## Anti-accretion review

Before merging, ask:

- Does this improve a current Rails-specific user outcome?
- Could a smaller deterministic rule solve it?
- Does it introduce a new source of truth?
- Does it make local/remote, approval or verification truth less explicit?
- Is it a general framework feature Mavona does not need?
- Is its benchmark or product value testable?

If the answers expose speculative complexity, remove or defer it.
