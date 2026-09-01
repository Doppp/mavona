# Mavona 0.1.0 Specification

**Status:** Implementation-ready  
**Scope:** Non-mutating planning harness  
**Date:** 1 September 2026  
**Version:** 0.1.0

## 1. Objective

0.1.0 proves that Mavona can inspect an unfamiliar Rails repository and generate an evidence-backed implementation plan approaching the quality and downstream usefulness of the hand-written plans produced in Phase 0.

0.1.0 does **not** edit application code.

Public workflow:

```text
mavona init
mavona plan "<task>"
```

Unconditional discovery-layer implementation may proceed while Phase 0 runs.

Planning/verifier strategy is informed by Phase 0 before stabilization.

## 2. Definitions

**Task** — complete user-requested unit of work.

**Slice** — planned independently verifiable portion of a task.

**Verifier** — deterministic or repository-defined check that would produce correctness evidence for future implementation.

**Evidence** — structured observation supporting a repository fact, convention, impact relationship, verifier recommendation or legibility finding.

**Protected grader** — acceptance tests/checks unavailable to the coding agent and written before the run.

**Independently verified completion** — protected grader passes and no predeclared human-review disqualifier applies.

**Gold task** — Phase 0/evaluation task with protected specification, verified successful diffs where available and independent Rails-reviewer annotation.

## 3. Public CLI

### `mavona init`

```bash
mavona init
```

Performs static-first project discovery.

May recommend minimal `.mavona.yml`; writing configuration requires explicit user acceptance.

Must not modify application source.

### `mavona plan`

```bash
mavona plan "Add account suspension"
```

Optional:

```bash
mavona plan --format markdown "..."
mavona plan --format json "..."
```

`--format` affects stdout only.

Canonical plan/task state is JSON. A Markdown view may also be persisted.

## 4. Planning architecture

`mavona plan` is deterministic-first.

```text
repository discovery
      ↓
deterministic Rails analysis
      ↓
deterministic plan skeleton
      │
      ├── valid offline output
      │
      ▼
optional agent enrichment
      ↓
validated enriched plan
```

### Deterministic layer must produce

- project profile;
- repository evidence;
- likely affected areas;
- candidate public interfaces where statically inferable;
- candidate data changes;
- candidate downstream callers;
- verifier recommendations;
- planability status;
- structured plan skeleton.

### Optional agent enrichment may add

- concise summary;
- risks;
- implementation-slice decomposition;
- higher-order architectural implications;
- ambiguity interpretation.

Agent enrichment may not erase deterministic evidence or convert `unknown` into certainty without evidence.

The deterministic plan must be testable and usable without network/model access.

## 5. Technology stack

- Ruby
- Ruby gem/executable
- local JSON + Markdown
- git CLI
- Prism where available; Ripper where useful
- Rails/Bundler/repository-native static inspection
- Minitest if repository is greenfield; otherwise preserve existing tests

No Node.js, TypeScript, browser automation or database in 0.1.0.

## 6. Repository reconnaissance gate

Before implementation, inspect the actual Mavona repository:

1. project type;
2. Ruby version;
3. test framework;
4. CLI approach;
5. dependencies;
6. namespace/layout;
7. CI commands;
8. instruction files;
9. current branch;
10. existing implementation.

## 7. Target repository discovery

Capture:

```text
repository root
current branch
HEAD SHA
working-tree state
remote default branch if discoverable
candidate Rails roots
```

Never hard-code branch names.

### Multiple Rails roots

If multiple candidate apps exist:

- select only when working directory/task scope makes one clear;
- otherwise return `NEEDS_DECISION`.

Cross-application planning is out of scope for 0.1.0.

## 8. Static-first degradation

`mavona init` must not require Rails boot.

If boot/introspection fails:

```text
continue static discovery
mark boot-derived fields unknown
record evidence
optionally emit legibility finding
```

Do not fail init solely because credentials/DB/services/env are unavailable.

## 9. Project instruction discovery

Inspect scoped instruction/documentation files such as:

```text
AGENTS.md
CLAUDE.md
GEMINI.md
README.md
CONTRIBUTING.md
nested scoped instructions
```

Record scope/provenance.

Do not concatenate everything into one giant prompt.

## 10. Rails project profile

Discover or mark unknown:

```text
project type
Ruby version
Rails version
Bundler version
database adapter
schema format
test framework
job backend
frontend approach
lint/security tools
CI commands
safe test commands
safe boot commands
```

Record elapsed time.

## 11. Component inventory

Inventory:

```text
models
controllers
jobs
mailers
channels
policies
services
forms
queries
presenters
components
concerns
routes
migrations
schema/tables
tests/specs
factories/fixtures
initializers
engines
Rake tasks
custom autoload/eager-load paths
```

Avoid expensive parsing when filesystem structure suffices.

## 12. Unified evidence envelope

```yaml
id: ev_001
task_id: null
session_id: init_001
kind: repository_fact | convention | impact | verifier_recommendation | legibility
subject: ...
observation: ...
confidence:
  label: high | medium | low | unknown
  score: null
  basis: ...
sources:
  - path: ...
    line: ...
metadata: {}
```

At least one provenance owner is required: `task_id` or `session_id`.

`mavona init` may use a session ID because initialization is not inherently a task. Plan evidence should use its task ID.

Required fields are `id`, `kind`, `subject`, `observation`, `confidence`, `sources`, and at least one provenance owner.

## 13. Convention confidence

For repeated-instance conventions, report raw support.

```text
high   >= 0.80
medium >= 0.50 and < 0.80
low    < 0.50
```

Always expose numerator/denominator.

## 14. Planability schemas

Statuses:

```text
PLAN_READY
NEEDS_DECISION
TOO_BROAD
UNSUPPORTED
```

### PLAN_READY

```yaml
status:
summary:
public_interfaces:
internal_components:
data_changes:
downstream_callers:
affected_files_or_areas:
implementation_slices:
tests:
verifiers:
risks:
assumptions:
non_goals:
escalations:
evidence:
```

### NEEDS_DECISION

```yaml
status: NEEDS_DECISION
summary:
questions:
  - question:
    why_it_matters:
    affects:
    evidence_ids:
known_scope:
evidence:
```

### TOO_BROAD

```yaml
status: TOO_BROAD
summary:
proposed_tasks:
  - title:
    outcome:
    likely_scope:
    dependencies:
decomposition_rationale:
evidence:
```

### UNSUPPORTED

```yaml
status: UNSUPPORTED
summary:
reason:
known_scope:
next_step:
evidence:
```

## 15. Impact analysis

### Primary nomination signals

A file/area enters candidate scoring only if it has at least one primary signal with strength >= 0.60:

```text
direct task-name match             1.00
explicit route/caller relationship 0.90
association/reference relationship 0.75
corresponding test naming          0.70
constant/reference grep            0.55
```

### Secondary boosting signals

Secondary signals may strengthen an already nominated candidate, but can never nominate a candidate alone:

```text
Git co-change       0.45
directory proximity 0.20
```

This prevents weak correlated signals from accumulating into a misleading candidate.

### Combination heuristic

The scoring rule is a deterministic, hand-tuned heuristic—not a statistical probability model.

```text
score = min(
  1.0,
  strongest_primary
  + 0.20 * second_primary
  + 0.10 * third_primary
  + 0.10 * strongest_secondary
)
```

Use at most one secondary boost. Record every contributing signal.

Labels:

```text
high   >= 0.80
medium >= 0.50 and < 0.80
low    < 0.50
```

Direct task-name matches saturate the score at 1.0; ties among saturated candidates are ranked using secondary evidence for ordering only, not confidence.

### Inclusion threshold

Only **medium/high** candidates enter `affected_files_or_areas` by default.

Low-confidence candidates remain evidence and may appear in verbose/debug output.

All weights are provisional and must be recalibrated against gold data rather than allowed to ossify as presumed truth.

## 16. Verifier recommendation

Use:

- component type;
- convention mapping;
- test naming;
- constant/reference relationships;
- route/association/caller evidence;
- Git co-change.

When confidence is low, widen:

```text
focused
→ related
→ component/directory
→ broader relevant suite
```

Expose candidate verifiers, evidence and expected breadth.

## 17. Verifier evaluation

Gold/fixture repos contain known-breaking mutations.

For each mutation, record tests that reveal the defect.

Primary diagnostic:

```text
Verifier Recall =
known bug-revealing tests recommended
────────────────────────────────────
known bug-revealing tests
```

Also record:

- runtime of recommended verifier set;
- number of tests/commands selected.

Do not use an undefined verifier-precision metric.

## 18. Gold-set construction

Phase 0 should primarily use curated historical merged Rails PRs.

For each evaluation task use:

1. protected task specification;
2. one or more independently verified successful diffs;
3. independent Rails-reviewer annotation.

Historical merged diffs are implementation evidence, not the sole definition of correctness. Reviewer annotation distinguishes logically required surfaces from incidental files and may recognize multiple valid implementations.

The Condition D plan/profile author must not inspect protected graders or merged diffs. If separation cannot be maintained, mark the resulting uplift estimate as an upper bound.

## 19. Plan-quality evaluation

Primary promotion outcome is downstream independently verified completion.

Diagnostics are:

- affected-surface recall at a precision floor;
- affected-surface precision;
- interface recall/precision where applicable.

The precision floor is fixed to the precision achieved by the hand-written Phase 0 plans **before** generated-plan results are examined.

Do not use raw recall alone as a gate.

## 20. Optional enrichment ablation

Implement the minimum enrichment path behind a default-off/experimental flag so it can actually be tested.

Evaluate:

```text
deterministic plan
vs
deterministic + agent enrichment
```

Measure downstream outcome, plan diagnostics, added latency and added cost. Only then decide whether enrichment ships enabled, remains experimental or is removed.

## 21. Evaluation budgets

### Phase 0 run budget

Stage 1 is fixed at 40 agent runs (20 tasks × A/D). Stage 2 and Stage 3 run only if their gates are met.

Before Stage 1 begins, record:
- maximum curator/reviewer hours;
- maximum Condition D authoring hours;
- maximum evidence-packet hours;
- maximum total model/API spend.

Condition D profile + plan authoring is capped at 45 minutes per task.

Declare separate budgets before execution.

### Phase 0 budget

Covers task curation, grader validation/augmentation, manual profiles/plans, evidence packets, reviewer time and Stage 1 agent runs.

### 0.1.0 evaluation budget

Covers deterministic-plan downstream runs, enrichment downstream runs if built and baseline reruns required for comparability.

Record maximum runs, maximum human hours and maximum spend.

## 22. 0.1.0 promotion/kill criterion

Do not proceed automatically to 0.2.0.

Generated plans must not materially worsen downstream independently verified completion relative to the hand-written Phase 0 plans. Diagnostics explain why.

## 23. Performance targets

Representative ~100k-line Rails repo:

```text
mavona init static discovery: < 30 sec
deterministic plan:          < 30 sec
optional enriched plan:      target < 90 sec
```

Record timing in tests/UAT.

Include larger synthetic/fixture repos to catch scaling regressions.

## 24. Persistence

```text
.mavona/
  tasks/
    <task-id>/
      task.json
      project-profile.json
      evidence.json
      plan.json
      plan.md
```

`plan.json` is canonical.

## 25. Test strategy

Default CI requires no paid agent.

### Unit

Test:

- Git/root discovery;
- branch discovery;
- monorepo handling;
- static-only degradation;
- project profile;
- instruction discovery;
- component inventory;
- evidence envelope;
- convention confidence;
- impact combination rule;
- planability schemas;
- plan validation;
- Git co-change;
- verifier recommendation;
- persistence.

### Fixture integration repos

Include:

1. ordinary Rails app;
2. no `.mavona.yml`;
3. dirty tree;
4. unknown default branch;
5. custom service convention;
6. migration task;
7. TOO_BROAD;
8. NEEDS_DECISION;
9. app unable to boot;
10. monorepo with two Rails roots;
11. large repo;
12. labeled breaking mutations.

### Optional enrichment tests

```text
Fake adapter    → unit
Replay cassette → deterministic integration
Live agent      → UAT/evaluation
```

## 26. Acceptance criteria

### Unconditional discovery layer

- [ ] CLI skeleton
- [ ] repository/Git discovery
- [ ] branch detection without hard-coding
- [ ] instruction discovery
- [ ] static project profile
- [ ] component inventory
- [ ] unified evidence model
- [ ] static-only degradation

These may be implemented while Phase 0 runs.

### Phase 0 prerequisite for stabilization

- [ ] protected graders defined
- [ ] Stage 1 decision rule executed
- [ ] Phase 0 hand-written plans/profiles preserved
- [ ] successful verified diffs preserved

### Planning

- [ ] deterministic plan works offline
- [ ] status-specific schemas validate
- [ ] impact scoring is reproducible
- [ ] verifier recommendations expose evidence
- [ ] optional enrichment cannot overwrite deterministic facts

### Evaluation

- [ ] verifier recall measured
- [ ] recommended verifier runtime measured
- [ ] affected-surface recall/precision measured
- [ ] downstream outcome measured against hand-written Phase 0 plans
- [ ] enrichment ablation measured if enrichment ships
- [ ] evaluation run/time/cost budget recorded
- [ ] 0.1.0 promotion/kill decision recorded

## 27. Explicit non-goals

Do not implement:

- repository mutation;
- repair loops;
- checkpoints/rollback;
- resume;
- budget accounting;
- App Inspection;
- browser automation;
- critique;
- reviewer agents;
- runtime test impact;
- dynamic verifier learning;
- benchmark leaderboard;
- worktree orchestration;
- cross-task memory.

## 28. Authoritative implementation order

```text
A. Start immediately
1. Inspect Mavona repo
2. Establish baseline
3. CLI skeleton
4. repository/Git discovery
5. branch/default detection
6. multi-root handling
7. instruction discovery
8. static Rails profile
9. component inventory
10. unified evidence envelope
11. static-only degradation

B. In parallel
12. Curate Phase 0 historical PR tasks
13. Validate/augment protected graders
14. Separate grader visibility from Condition D plan/profile authorship
15. Run Stage 1
16. Record paired outcomes, human time and cost

C. After Phase 0 informs planning strategy
17. convention confidence
18. impact nomination/scoring
19. verifier recommendation
20. planability schemas
21. deterministic plan skeleton
22. plan validation
23. persistence
24. `mavona init`
25. `mavona plan`
26. minimal default-off enrichment implementation
27. fixture/gold evaluations within predeclared budget
28. compare generated vs hand-written plans
29. apply 0.1.0 promotion criterion
```

## 29. Completion report

```markdown
## Summary
## Public CLI
## Repository conventions followed
## Files changed
## Tests and fixtures
## Commands/results
## Performance
## Phase 0 paired outcomes and cost/human time
## Evaluation budget and actuals
## Verifier recall/runtime
## Plan-quality diagnostics
## Downstream verified outcome
## Optional enrichment ablation
## 0.1.0 promotion/kill decision
## Assumptions
## Open questions
## Deferred work
```
