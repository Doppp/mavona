# Mavona Roadmap

**Status:** Active roadmap  
**Date:** 2 September 2026
**Versioning:** Semantic Versioning

## Phase 0 — Validate the harness hypothesis

Phase 0 happens before the contingent task-routing, task-context and verifier layers of 0.1.0. Unconditional repository-discovery work may proceed in parallel.

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

The person authoring Condition D's repository treatment must **not** inspect the protected grader or merged implementation diff for that task.

Preferred:

```text
grader/reviewer role != Condition D treatment author
```

If this separation cannot be maintained because of team size, record that limitation explicitly and treat measured Stage 1 uplift as an **upper bound**, not an unbiased estimate.

### Stage 1 — Does the maximal treatment help?

Use 20 diverse Rails tasks, one coding agent, one attempt per task per condition, and conditions A and D only: 40 runs total.

**A — Native:** task + pre-change repository using the agent's normal workflow.

**D — Manual Mavona treatment:** the same task plus a concise Rails policy, manually selected task-scoped Rails evidence, proportionate planning only when warranted, independently selected focused verification and human-written evidence packets when verification fails. The D author sees only the task description and pre-change repository, never the protected grader or merged diff.

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
- C: repository profile + narrow Rails evidence + proportional task routing.

```text
A → B   repository-profile value
B → C   task-context and proportional-ceremony value
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

Before Stage 1, estimate and record task-curation hours, grader validation/augmentation hours, evidence/context-authoring hours, any proportional-planning hours, expected failure-packet time, reviewer hours and agent-run budget. Reduce or stop the experiment if setup cost becomes disproportionate to the product question.

### Phase 0 output

Preserve frozen task snapshots, task provenance, protected graders, grader metadata, hand-written profiles/evidence packets, task-routing decisions, any proportionate plans, verifier choices, failure packets, final diffs, paired outcomes and human-time/cost measurements.

# 0.1.0 — Rails understanding harness

Public commands:

```text
mavona init
mavona plan "<task>" # explicit planning when requested or warranted
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
- static-only degradation behavior;
- concise Rails-native agent policy.

## Work gated on Phase 0 Stage 1

The following should be informed by Stage 1 before being stabilized:

- task-surface analysis sophistication;
- task-routing and proportional-planning strategy;
- verifier-recommendation strategy;
- optional evidence/plan enrichment behavior.

## Task-understanding architecture

The deterministic path discovers Rails evidence and chooses proportional ceremony:

```text
deterministic Rails analysis
        ↓
task-scoped evidence
        ↓
direct_change | lightweight_plan | full_plan
```

`direct_change` creates no formal plan artifact. The other modes create only the structure needed for their complexity. Explicit `mavona plan` remains available for a user-requested plan.

Optional enrichment may improve selected evidence or a warranted plan, but may not turn the policy prompt into procedural boilerplate. It is independently measurable.

## 0.1.0 empirical question

> Can Rails-native evidence, a small policy prompt and proportional planning improve downstream independently verified completion at acceptable overhead?

## Gold-set construction

Do not treat a repository-treatment author's own annotations as ground truth.

For each Phase 0 task, construct evaluation references from:

1. protected task specification;
2. one or more independently verified successful diffs;
3. independent Rails-reviewer annotation.

The reviewer annotation distinguishes logically required surfaces from incidental files touched by one implementation.

## Task-understanding diagnostics

Primary product outcome remains downstream independently verified completion.

Diagnostic metrics include affected-surface recall at a declared precision floor, affected-surface precision and interface recall/precision where applicable.

The precision floor is **the precision achieved by the hand-written Phase 0 evidence packets**, fixed before generated results are examined. Do not choose the floor after seeing Mavona's numbers. For tasks routed to a planning mode, retain plan-quality diagnostics as secondary measurements.

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

At minimum account for generated deterministic task-understanding runs, enrichment runs if implemented and any manual-treatment baseline reruns needed for comparability.

Set maximum agent runs, human hours and spend before evaluation begins.

## Optional enrichment

Build only the minimum enrichment path needed for evaluation, behind a default-off/experimental flag. Then ablate:

```text
deterministic task understanding
vs
deterministic + enrichment
```

Measure downstream verified outcome, evidence and routing diagnostics, plan diagnostics where applicable, added latency and added cost. Afterward decide whether enrichment ships enabled, remains experimental or is removed.

## 0.1.0 promotion/kill criterion

Do not proceed automatically to 0.2.0.

Generated task treatments must not materially worsen downstream independently verified completion relative to the manual Phase 0 treatments. Evidence, routing, plan and verifier metrics are diagnostics that explain why.

## Performance research targets

Representative ~100k-line Rails repo:

- `mavona init` static discovery: under 30 seconds;
- static task understanding: under 30 seconds;
- optional enriched task treatment: target under 90 seconds.

These are research targets until validated on representative hardware.

---

# 0.2.0 — Change + Verify

## Pre-release sequence

The unpublished 0.2.0 line will move through small, reviewable stages:

| Source version | Git tag | Purpose |
| --- | --- | --- |
| `0.2.0.alpha.1` | `v0.2.0-alpha.1` | Current provider and interactive-harness foundation |
| `0.2.0.alpha.2` | `v0.2.0-alpha.2` | Trustworthy change detection and verification |
| `0.2.0.beta.1` | `v0.2.0-beta.1` | Complete public CLI and install workflow |
| `0.2.0.rc.1` | `v0.2.0-rc.1` | Open-source release candidate |
| `0.2.0` | `v0.2.0` | First stable release after the separate release gates are satisfied |

RubyGems uses dotted pre-release versions in source. Git tags use the equivalent
hyphenated Semantic Versioning form. Additional builds increment the final
number without changing the purpose of the stage.

Provider integration foundation now implemented:

- interactive first-run connection flow and `/connect`, `/model`, `/status`, `/logout`;
- OpenAI, Anthropic and shared OpenAI-compatible API transports;
- Ollama and LM Studio loopback discovery plus custom compatible endpoints;
- normalized streaming/tool events, deterministic fake and bounded local capability preflight;
- official Codex authentication bridge with subscription execution explicitly blocked at the agent-loop ownership mismatch;
- non-secret user/project configuration, session/Keychain credential stores and enforced local-only networking;
- deterministic proportional task routing, bounded task-context compilation and focused verifier selection;
- canonical per-task JSON artifacts, repository change tracking and single mutable-task locking.

The remaining 0.2.0 work is empirical calibration of task-surface and verifier heuristics against the protected Rails evaluation set. Subscription inference remains blocked on a suitable official provider surface.

Adds:

```text
mavona change "<task>"
mavona verify
```

Capabilities:

- agent adapters;
- concise policy + task-scoped evidence packets;
- proportional task routing;
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
