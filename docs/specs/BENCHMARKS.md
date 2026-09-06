# Mavona v0.1 evaluation and learning

**Status:** Preserved evaluation philosophy with v2 execution contract

## 1. Question

Does Mavona increase independently verified completion on realistic Rails tasks across supported models, at acceptable regression, cost, latency and human-attention overhead?

The benchmark is not the product test suite. Product tests prove Mavona behaves as specified. Protected evaluation measures whether that behavior actually helps coding models.

## 2. Primary outcome

A run is an independently verified completion only when:

```text
protected grader passes
AND
no predeclared human-review disqualifier applies
```

Agent-written tests and claims do not define success. Missing, skipped or errored grading is not a pass.

## 3. Evidence states

Evaluation orchestration records:

```text
passed | failed | not_run | error
```

Correctness summaries normalize `not_run` and `error` to `unknown`. Reports preserve the operational distinction.

## 4. Task corpus

### Existing smoke corpus to preserve

The Ruby prototype contains nine tasks across three pinned public repositories:

| Repository | Coverage | Tasks |
| --- | --- | --- |
| `fractaledmind/wrocloverb-2024` | Compact conventional Rails/Minitest | title normalization/uniqueness, comment length, public post filtering/order |
| `lobsters/lobsters` | Mature Rails/RSpec, messaging/jobs | whitespace subject, tag JSON key, idempotent message notification |
| `fat_free_crm/fat_free_crm` | Mature namespaced conventions | account normalization, literal LIKE search, website URL safety |

V2 ports task definitions, pinned commits, graders and isolation behavior before altering the corpus. The existing suite is a smoke evaluation, not statistically powered evidence.

### Phase 0 corpus and preregistration

Stage 1 is an optional feasibility and learning pilot alongside implementation: **12 tasks from 4 Rails repositories, 3 tasks per repository**, distinct from the nine historical smoke tasks. Use three attempts per task per condition: 12 × 2 × 3 = **72 attempted runs maximum**. Cover model/controller, persistence/authorization, job and user-flow changes. Freeze eligibility, task strata and repository selections before outcomes are observed.

Each task has a pinned pre-change snapshot, prompt, provenance, independently reviewed required surfaces, protected behavioral grader, contamination notes and reproducible setup. Review inherited PR tests for solution coupling. Historical solutions are not the only valid implementation. Treatment authors cannot inspect graders or merged solutions.

Preregistration fixes model/build, reasoning settings, per-run time/tool/token limits, monetary ceiling, human authoring budget, run randomization, attempt identifiers and infrastructure-error handling. Set dollar limits from the chosen provider's actual pricing before launch; do not start live runs with an unspecified spend ceiling. Three attempts are an initial variance diagnostic, not proof of adequate statistical power. The pilot spans only four repositories and cannot support strong generalization claims.

The initial human-work ceiling is **40 hours total**, including repository setup, grader construction/review, treatment authoring, execution supervision and analysis. Track hours by category. The 45-minute per-task treatment cap remains a maximum, not a target. Reserve 8 hours for analysis/reporting; stop preparation at 32 hours if the corpus is not ready. The goal is 12 reproducible tasks, not a promise they can be prepared within the ceiling. If resources cannot support 72 runs or the planned corpus within this ceiling, define a smaller explicitly exploratory protocol before any outcome is inspected. If limits are reached after outcomes exist, report the incomplete experiment rather than redefining it. Do not change N, include tasks or retry selectively after observing treatment success. A later 48-task/eight-repository design is an optional separately budgeted expansion, not the default entry cost or a automatically powered confirmation.

## 5. Protected grading

- Grader source and assertions never enter the agent checkout, context or accessible filesystem.
- A runner outside the agent boundary installs a randomly named temporary grader only after the agent exits.
- Agent-written tests remain diagnostic.
- Graders assert behavior, not internal names or structure unless the task explicitly requires them.
- Each inherited PR test undergoes solution-coupling review; relax, augment behaviorally or drop it.
- Grade application code state plus predeclared disqualifiers such as destructive unrelated change, test tampering or forbidden network/production action.

## 6. Conditions

Use the same model/version, task snapshot, budgets and tool affordances wherever the comparison permits.

### Stage 1: maximal treatment

Paired conditions:

- **A — Baseline:** task plus the coding environment's ordinary default behavior.
- **D — Maximal Mavona treatment:** hand-authored Rails evidence packet, proportional route/plan and verifier recommendations representing the strongest plausible Mavona output.

Condition D treatment authoring is capped at 45 minutes per task. The author may inspect the pre-change repository and task but not protected grader or merged solution. If separation is impossible, label results an upper-bound estimate.

Paired report:

| Cell | Meaning |
| --- | --- |
| both pass | task is easy or treatment unnecessary |
| A only | treatment harms or distracts |
| D only | treatment creates directional uplift |
| both fail | task/model/budget may be inadequate |

### Stage 1 analysis and learning outcomes

Retain all three attempt outcomes per task/condition, including infrastructure failures. Report setup reproducibility, grader review findings, treatment examples that help or harm, task/repository effects, human hours and model/tool costs. There are only 12 tasks and four repositories: this pilot cannot reliably establish a modest completion-rate improvement. Its preliminary variance estimates need sensitivity analysis when planning a larger experiment.

There is **no numeric promotion threshold**, no repository sign-count gate and no unresolved investment branch. An inconclusive, under-budget incomplete or unavailable pilot does not block Rails intelligence or any other v0.1 feature. Continue implementation. Observed concrete defects and serious disqualifiers trigger targeted fixes and regression tests, not automatic abandonment of the product scope. Absence of observed harm is not proof of safety.

Track preparation hours by setup, grader construction, independent review, treatment authoring and analysis from task one; checkpoint cost after task three. Retain per-attempt matched outcome tables and repository-level estimates with explicit uncertainty assumptions. Do not treat attempts on the same task as independent tasks. Do not modify the corpus after seeing outcomes; a revised protocol is a separate future experiment.

The pilot succeeds as a learning exercise if it produces reproducible fixtures, credible protected checks and documented lessons; statistical significance is not required. Its results inform optimization and later experiment sizing, not authorization to complete v0.1.

### Stage 2: ablation

On informative tasks, compare components needed to explain uplift:

- deterministic Rails evidence;
- evidence plus proportional task routing/plan;
- evidence plus verifier recommendation;
- full treatment;
- optional model-enriched treatment, if implemented.

Do not multiply conditions beyond the predeclared run and spend budget. Use Stage 1 discordant cells for exploratory diagnosis only. Freeze ablation hypotheses and confirm on fresh tasks; selection based on observed outcomes cannot support an unbiased uplift claim.

### Stage 3: generalization

For a future comparative performance claim, run held-out repositories, task types and multiple models/provider classes when resources permit. Before confirmation, choose and freeze its corpus size using pilot variance, repository clustering, a proposed minimum worthwhile effect of 10 percentage points for study sizing only, 80% power and 5% two-sided error as design inputs. Record the simulation/code and resulting N in the preregistration. If unaffordable, report the pilot as exploratory rather than inventing power. Do not reuse pilot-selected tasks as confirmatory evidence. Include at least one frontier API, one affordable API and one capable local model where hardware permits.

## 7. Diagnostics

Diagnostics explain outcome; they do not replace it.

### Affected-surface quality

Measure recall and precision against independently reviewed logically required surfaces. The inclusion precision floor is the hand-written Phase 0 treatment's precision, fixed before generated results are seen.

Primary signals nominate. Weak signals such as co-change/directory proximity only boost. Constant/reference grep alone cannot clear inclusion.

### Verifier recommendation

```text
Verifier recall = known bug-revealing tests recommended / known bug-revealing tests
```

Also measure selected verifier runtime and count. Compare against:

- full suite;
- naive same-named test mapping.

### Plan and context

- planning route accuracy;
- unnecessary plan rate;
- required interface/surface coverage;
- context bytes/tokens;
- irrelevant context rate;
- context widening frequency and cause.

### Operational cost

- input/output/cached tokens;
- monetary cost;
- elapsed time;
- tool calls and model turns;
- human approvals/interventions;
- manual treatment time;
- human repair time;
- verifier runtime;
- crashes and recovery.

## 8. Budgets and reproducibility

Before each experiment freeze:

- maximum agent runs;
- model IDs, provider and version/build identifiers;
- temperature/reasoning controls when exposed;
- wall-clock and tool-step limits;
- maximum cost;
- maximum human hours;
- retry policy;
- task/condition randomization;
- environment/hardware fingerprints.

Never invent unavailable token counts. Mark them unknown and retain provider usage evidence that actually exists.

Runs begin from equivalent clean clones/worktrees. Record exact Git SHAs, Mavona version, compiled executable checksum, configuration digest and grader version.

## 9. V2 port acceptance

Capture v1 evidence during Milestone 0 and port the smoke runner during Milestones 1–2 under `docs/specs/PARITY.md`. Before using v2 to make comparative claims:

1. Port all nine existing task definitions and graders without semantic change.
2. Prove repository isolation, clean checkout and grader hiding structurally.
3. Run fake-agent fixtures and compare v1/v2 result semantics.
4. Record any unavoidable setup drift.
5. Produce the same paired report categories.
6. Keep live/provider evaluation opt-in and out of normal CI.

Do not require v2 to reproduce stochastic agent output. Require it to reproduce task setup, budgets, grading and outcome semantics.

## 10. Canonical Rails dogfood app

Create a separate, real Rails application used for development demonstrations and deterministic end-to-end tests. It should contain:

- Active Record models with associations, validations, callbacks and a state transition;
- controllers and authorization;
- jobs with retry/idempotency concerns;
- mailers;
- migrations and both schema formats where feasible across variants;
- Hotwire/Turbo/Stimulus behavior;
- Minitest plus system tests in the canonical app;
- an optional RSpec variant/fixture;
- Solid Queue or current Rails-integrated jobs;
- intentionally scoped tasks with hidden behavioral graders.

Mavona's own TypeScript repository cannot prove the Rails-specific product claim.

## 11. App Inspection evaluation

App Inspection is a user-required MVP capability. Its admission follows the explicit current-user-need branch of the product complexity rule. Evaluation measures overhead, correctness and uplift rather than constituting the sole basis for its existence. Retain all nine historical smoke tasks unchanged and add a separately versioned browser task set to avoid changing past denominators.

Include Rails view/layout, Turbo navigation, Stimulus interaction, authorization and form-state tasks. Freeze app/fixture data, browser builds, fonts, viewport, network policy and budgets. Compare paired runs with and without inspection using the same model and tasks; report DOM-only versus vision input separately. Record completion, false passes, regressions, browser steps, image tokens when known, wall time and human interventions. Missing engine or unexecuted assertions are unknown. Keep protected flow assertions outside agent access and grade application outcomes independently of screenshots or model opinion.

## 12. Optimization and claim rules

- Generated treatments must not materially worsen verified completion against hand-authored treatments.
- No feature promotes because a proxy metric improved while downstream completion regressed.
- Provider/model expansion does not ship without the same adapter, safety and tool-use contract.
- A Rails heuristic that increases context or verifier runtime without outcome value is simplified or removed.
- If measured overhead exceeds benefit, simplify internal mechanisms and improve the affected workflow while retaining the required product capabilities. Do not add stronger prompts or more agents to obscure the problem.

## 13. Reporting template

```text
Experiment and preregistration
Repositories/tasks and provenance
Models/providers and exact versions
Conditions and budgets
Paired primary outcomes
Regressions/disqualifiers
Cost, latency and human attention
Affected-surface diagnostics
Verifier recall/runtime
Context and planning diagnostics
Failures and missing data
Interpretation
Implementation improvements and limits on comparative claims
Artifacts and checksums
```
