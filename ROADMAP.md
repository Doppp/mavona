# Mavona Roadmap

**Status:** Active roadmap  
**Date:** 1 September 2026  
**Versioning:** Semantic Versioning

## Phase 0 — Validate the harness hypothesis

Phase 0 happens before the contingent planning/verifier layers of 0.1.0. Unconditional repository-discovery work may proceed in parallel.

This is a directional product experiment, not a significance test.

### Primary task source: curated historical Rails PRs

Phase 0 should primarily harvest real merged pull requests from open-source Rails applications rather than author synthetic tasks from scratch.

For each candidate task, record:

```text
repository
pre-change SHA
task / issue / PR description
merge date
merged diff
tests added or changed
source reference
public/private provenance
suspected model-contamination risk
grader provenance
```

Prefer tasks with a clear pre-change snapshot, clear outcome, meaningful tests, reproducible setup, bounded scope and room for alternate valid implementations. Reject tasks whose inherited tests are obviously too weak or overly coupled to one implementation.

Public historical tasks may exist in model training data. Phase 0 therefore provides directional evidence, not a final uncontaminated benchmark claim. Later benchmark work must include private/held-out tasks.

### Protected grading

The primary metric is **independently verified completion**.

For each task:

1. freeze the pre-change repository snapshot;
2. derive the agent-visible task from issue/PR intent;
3. construct or validate protected grader checks from the merged PR tests and task semantics;
4. keep the protected grader and merged implementation diff out of agent context;
5. define a narrow human-review disqualification rubric before runs.

The protected grader may include inherited PR tests, augmented hidden tests, structural checks, schema/data assertions and test-integrity checks.

A deterministic pass may be rejected only for predeclared disqualifiers such as task semantics clearly not being satisfied, destructive behavior, test tampering, major unrelated changes or an obvious security/data-integrity regression. Human review is not a style-preference gate.

```text
protected grader passes
AND
no predeclared human-review disqualifier
= independently verified completion
```

### Grader / Condition D separation

The person authoring Condition D's repository profile and plan must **not** inspect the protected grader or merged implementation diff for that task.

Preferred:

```text
grader/reviewer role != Condition D plan/profile author
```

If this separation cannot be maintained because of team size, record that limitation explicitly and treat measured Stage 1 uplift as an **upper bound**, not an unbiased estimate.

### Stage 1 — Does the maximal treatment help?

Use 20 diverse Rails tasks, one coding agent, one attempt per task per condition, and conditions A and D only: 40 runs total.

**A — Native:** task + pre-change repository using the agent's normal workflow.

**D — Manual Mavona treatment:** the same task plus a manually prepared Rails repository profile, hand-written structured Mavona plan, independently selected focused verification and human-written evidence packets when verification fails. The D author sees only the task description and pre-change repository, never the protected grader or merged diff.

Record agent cost, human harness minutes and repair interventions.

### Stage 1 paired reporting

Report paired outcomes, not merely two headline success rates:

| Outcome | Count |
|---|---:|
| both A and D pass | |
| A only passes | |
| D only passes | |
| both fail | |

The discordant cells are the primary directional signal and feed Stage 2 directly.

Pre-register the decision rule:

```text
If D-only <= A-only:
  do not proceed under the current harness thesis.

If D shows directional improvement but violates agreed cost or
human-effort bounds:
  revise the architecture before automation.

If D-only meaningfully exceeds A-only within acceptable bounds:
  continue to Stage 2.
```

Do not reinterpret this rule after seeing outcomes.

### Stage 2 — Where does uplift come from?

Only if Stage 1 is positive. Use the divergent tasks and run:

- B: repository profile only;
- C: repository profile + structured plan.

```text
A → B   repository-profile value
B → C   structured-plan value
C → D   independent-verifier-feedback value
```

### Stage 3 — Does the effect generalize?

Run Stage 3 **only if Stage 1/2 show a useful effect worth testing for agent generality**. Repeat the informative comparison with a second coding agent. Initial candidates are Codex and Claude Code.

### Phase 0 measurements and cost accounting

Primary measurements:

- independently verified completion;
- paired A/D outcome table;
- human harness minutes;
- cost per verified task;
- human repair interventions.

Before Stage 1, estimate and record task-curation hours, grader validation/augmentation hours, profile/plan-authoring hours, expected evidence-packet time, reviewer hours and agent-run budget. Reduce or stop the experiment if setup cost becomes disproportionate to the product question.

### Phase 0 output

Preserve frozen task snapshots, task provenance, protected graders, grader metadata, hand-written profiles/plans, verifier choices, evidence packets, final diffs, paired outcomes and human-time/cost measurements.

# 0.1.0 — Planning harness

Public commands:

```text
mavona init
mavona plan "<task>"
```

No application-code mutation.

## Work that may begin before Phase 0 completes

These are unconditional:

- CLI skeleton;
- Git/repository discovery;
- default branch detection;
- instruction discovery;
- static Rails project profiling;
- component inventory;
- unified evidence model;
- static-only degradation behavior.

## Work gated on Phase 0 Stage 1

The following should be informed by Stage 1 before being stabilized:

- impact-analysis sophistication;
- plan-generation strategy;
- verifier-recommendation strategy;
- optional agent-enrichment behavior.

## Planning architecture

`mavona plan` has two layers:

```text
deterministic Rails analysis
        ↓
deterministic plan skeleton
        │
        ├── usable offline
        │
        ▼
optional agent enrichment
        ↓
validated enriched plan
```

The deterministic path is required.

Agent enrichment is optional and independently measurable.

## 0.1.0 empirical question

> Can auto-generated plans approach the quality and downstream usefulness of the hand-written Phase 0 plans?

## Gold-set construction

Do not treat a plan author's own annotations as ground truth.

For each Phase 0 task, construct evaluation references from:

1. protected task specification;
2. one or more independently verified successful diffs;
3. independent Rails-reviewer annotation.

The reviewer annotation distinguishes logically required surfaces from incidental files touched by one implementation.

## Plan-quality diagnostics

Primary product outcome remains downstream independently verified completion.

Diagnostic metrics include affected-surface recall at a declared precision floor, affected-surface precision and interface recall/precision where applicable.

The precision floor is **the precision achieved by the hand-written Phase 0 plans**, fixed before generated-plan results are examined. Do not choose the floor after seeing Mavona's numbers.

## Verifier recommendation quality

For labeled breaking mutations, measure:

### Verifier Recall

```text
known bug-revealing tests recommended
────────────────────────────────────
known bug-revealing tests
```

Also track:

- runtime of recommended verifier set;
- number of tests/commands selected.

Do not use an ambiguous “useful test” precision metric.

## 0.1.0 evaluation budget

Budget downstream evaluation separately from Phase 0.

At minimum account for generated deterministic-plan runs, deterministic+enrichment runs if enrichment is implemented and any hand-written-plan baseline reruns needed for comparability.

Set maximum agent runs, human hours and spend before evaluation begins.

## Optional enrichment

Build only the minimum enrichment path needed for evaluation, behind a default-off/experimental flag. Then ablate:

```text
deterministic plan
vs
deterministic + agent enrichment
```

Measure downstream verified outcome, plan diagnostics, added latency and added cost. Afterward decide whether enrichment ships enabled, remains experimental or is removed.

## 0.1.0 promotion/kill criterion

Do not proceed automatically to 0.2.0.

Generated plans must not materially worsen downstream independently verified completion relative to hand-written Phase 0 plans. Plan/verifier metrics are diagnostics that explain why.

## Performance research targets

Representative ~100k-line Rails repo:

- `mavona init` static discovery: under 30 seconds;
- static plan construction: under 30 seconds;
- optional enriched plan: target under 90 seconds.

These are research targets until validated on representative hardware.

---

# 0.2.0 — Implement + Verify

Adds:

```text
mavona implement "<task>"
mavona verify
```

Capabilities:

- agent adapters;
- bounded implementation slice;
- canonical task state;
- Context Compiler;
- diff tracking;
- focused verifier execution;
- independent evidence;
- baseline caching;
- worktree ownership lock;
- fake/replay/live adapter test modes.

No autonomous repair loop yet.

---

# 0.3.0 — Repair + Safety

Adds:

- evidence-backed repair;
- bounded repair iterations;
- migration safety;
- test-integrity analysis;
- scope-expansion analysis;
- rule provenance/overrides;
- final implementation report;
- richer refusal/decomposition behavior.

App Inspection may be prototyped only if UAT/benchmark evidence shows value.

---

# 1.0.0 — Stable autonomous harness

Adds mature/stable contracts for:

- checkpoints/rollback;
- interruption/resume;
- budget accounting;
- critique;
- reviewer routing;
- App Inspection if validated;
- stronger worktree isolation;
- public/private benchmark suites;
- long-horizon autonomy.

---

## Continuous evaluation rule

After 0.1.0, compare meaningful releases against:

```text
native agent
previous Mavona release
current Mavona release
```

Track:

- independently verified completion;
- cost per verified task;
- human interventions per task.
