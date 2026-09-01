# Mavona Decisions

**Status:** Settled architectural decisions  
**Date:** 1 September 2026

Open questions belong in the relevant spec or vision document.

## D001 — Coding-agent agnostic

Mavona must not depend on Codex, Claude Code or one model/provider.

## D002 — CLI first

Mavona begins as a Ruby CLI/gem.

## D003 — Ruby-first core

Mavona Core is Ruby. Mavona itself is not a Rails application.

## D004 — App Inspection is separated from core

If App Inspection is built, it runs outside the Ruby core behind a narrow boundary.

Specific browser/runtime technology is not yet settled.

## D005 — Verification is independent

Mavona executes and records required verifiers itself.

## D006 — Default branch is discovered

Never hard-code `master` or `main`.

Precedence:

1. `.mavona.yml` override;
2. remote default branch;
3. current safe branch;
4. unknown.

## D007 — Low-confidence verification widens

```text
focused
→ related
→ component/directory
→ broader relevant suite
→ full suite when policy/cost permits
```

## D008 — Initial verifier selection uses cheap evidence

Signals include Rails conventions, component type, reference search, test naming, task-plan relationships, routes/associations/callers and Git co-change history.

## D009 — Ruby parser facilities are allowed

Use Prism where available and Ripper where useful.

## D010 — Plans are structured artifacts

`PLAN_READY` and refusal/decomposition statuses use status-specific schemas.

## D011 — Canonical task state outranks conversation

Long-term task state persists independently of one upstream agent conversation.

## D012 — Record/replay is part of test architecture

```text
Fake        → unit tests
Replay      → deterministic integration
Live agent  → UAT / benchmarks
```

## D013 — Critique is advisory by default

Only explicit policy violations, high-severity safety concerns or objectively violated architecture contracts may trigger critique-driven reimplementation.

Maximum critique-driven repair iterations: 1.

## D014 — At most one mutable task may own a worktree

This is a lock, not a dedicated-worktree-per-task requirement.

## D015 — Executable evidence has three states

```text
passed
failed
unknown
```

Not run never means passed.

## D016 — Baseline cache is keyed by repository state

```text
repository SHA
+
verifier identity/subset
+
relevant environment fingerprint
```

## D017 — Planning may refuse

```text
PLAN_READY
NEEDS_DECISION
TOO_BROAD
UNSUPPORTED
```

## D018 — App Inspection produces evidence

If built, app/browser inspection must feed verification rather than serve only as prompt decoration.

## D019 — Repository-legibility findings are first-class

Legibility findings are non-blocking repository-improvement findings.

## D020 — Documentation replaces superseded material

New material replaces old roadmap/architecture/acceptance definitions rather than accreting alongside them.

## D021 — Static discovery degrades gracefully

A Rails app that cannot boot must still allow static profiling where possible.

Boot-derived facts become `unknown`.

## D022 — Confidence is evidence-backed

Convention confidence reports raw support and label.

Initial convention thresholds:

```text
high   >= 0.80
medium >= 0.50 and < 0.80
low    < 0.50
```

Impact confidence exposes its contributing signals and provisional score.

## D023 — One evidence envelope

Repository facts, conventions, impact findings, verifier recommendations and legibility findings share a common evidence envelope.

## D024 — Canonical JSON; format controls presentation

Canonical machine state is JSON. Markdown is a human view. CLI `--format` controls stdout.

## D025 — Semantic Versioning

Mavona releases follow SemVer.

```text
0.1.0 Plan
0.2.0 Implement + Verify
0.3.0 Repair + Safety
1.0.0 stable autonomous-harness contracts
```

Breaking public CLI/config/artifact changes during `0.x` require a minor-version bump.

## D026 — Planning has deterministic core + optional enrichment

`mavona plan` must work without calling a coding agent.

Deterministic analysis produces the plan skeleton and evidence.

Optional coding-agent enrichment may add higher-level summaries, risks and decomposition.

The enrichment layer is independently benchmarked and may be disabled.

## D027 — Independently verified completion uses protected grading

A run is complete only if:

```text
protected grader passes
AND
no predeclared human-review disqualifier
```

Protected graders are written before agent execution and excluded from agent context.

## D028 — Downstream outcome outranks proxy plan metrics

Affected-surface recall/precision and verifier recall are diagnostic metrics.

Promotion decisions prioritize downstream independently verified completion.

## D029 — Phase 0 does not block unconditional discovery work

Repository/Git discovery, instruction discovery, static project profile, component inventory and evidence infrastructure may proceed while Phase 0 runs.

Planning/verifier strategy is gated by Phase 0 findings.

## D030 — Phase 0 primarily uses curated historical Rails PRs

Historical merged PRs provide realistic tasks, pre-change snapshots, inherited grader material and implementation evidence. Public-task contamination risk is recorded.

## D031 — Protected grader information must not leak into Condition D

Condition D's plan/profile author must not inspect the protected grader or merged diff. If separation is impossible, Stage 1 uplift is explicitly treated as an upper bound.

## D032 — Impact candidates require a substantive nomination signal

Weak contextual signals such as Git co-change or directory proximity may boost confidence but cannot nominate an affected surface alone. At least one primary signal >= 0.60 is required.

## D033 — Medium is the default affected-surface inclusion cutoff

Only medium/high candidates enter `affected_files_or_areas` by default. Low candidates remain evidence/debug output.

## D034 — Impact scoring is a hand-tuned heuristic

Primary signals nominate; secondary signals only boost. Scores are reproducible heuristics, not learned probabilities, and should be recalibrated from gold data.

## D035 — Stage 1 is reported as paired outcomes

Report both-pass, A-only, D-only and both-fail counts. Discordant cells drive the directional interpretation and Stage 2 selection.

## D036 — Evaluation budgets are predeclared

Phase 0 and 0.1.0 downstream evaluation have separate maximum run, human-time and spend budgets.

## D037 — Condition D authoring is timeboxed

Manual Phase 0 Condition D repository profile + plan authoring is capped at 45 minutes per task. Overruns are flagged and interpreted as upper-bound treatment.

## D038 — Stage 1 gate is numeric

Proceed to Stage 2 only if:

```text
D-only - A-only >= 5
AND
D-only >= 4
```

If both-pass + both-fail exceeds 80% of tasks, the task set is insufficiently discriminating and Stage 1 must be recalibrated rather than interpreted.

## D039 — Grep alone cannot clear impact inclusion

Constant/reference grep is a weak primary signal. It may create evidence, but without corroboration it cannot place a candidate into `affected_files_or_areas`.

## D040 — Historical PR graders require solution-coupling review

Inherited PR tests must be checked for internal identifiers/structure not derivable from the task description. Such assertions must be relaxed, behaviorally augmented, or the task dropped.

## D041 — Verifier selection is evaluated against baselines

Report Mavona verifier recall/runtime against:
- full-suite verification;
- naive same-named-test mapping.

## D042 — ROADMAP and SPEC have separate ownership

`ROADMAP.md` owns sequencing and gates. `SPEC-V0.1.md` owns formulas, thresholds, schemas and acceptance behavior. Do not duplicate normative details across both.
