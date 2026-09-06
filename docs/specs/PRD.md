# Mavona v0.1 — Product requirements and release specification

**Status:** Approved product direction; implementation target, not a released feature claim
**Specification revision:** 5 — complete v0.1 delivery
**Architecture:** TypeScript 7.0, Bun, OpenTUI/Solid and a narrow Ruby inspection bridge

## 1. Vision

Build a complete Rails-specific coding agent that lets a developer understand, change and verify a real application from a polished terminal interface. The developer can inspect the actual source and the running application, direct the agent precisely, choose their model and resume work without losing context or evidence.

Mavona should offer the interaction quality expected from Pi and OpenCode, with Rails understanding embedded in discovery, context selection, tools and verification. Its defining journey is: describe a Rails change, inspect the relevant code, let the agent implement it, exercise the application and review trustworthy results.

This is the complete **v0.1 MVP**, not a proof-of-concept, a fake-provider demo or an experiment waiting for permission to become a product. Incremental slices are implementation checkpoints. Continue through all required features. Comparative benchmarks measure and improve the product; they do not authorize its existence or block feature delivery.

## 2. User and product principles

The primary user is a solo or small-team Rails developer maintaining an existing application with finite time, attention and model budget. Support conventional and legacy Rails structures, weak test suites, local conventions and affordable/local models. One agent and one mutable worktree owner are the default.

- Follow existing application conventions, then standard Rails patterns, then introduce abstractions only when justified.
- Keep ordinary interaction compact and readable; make details available on demand.
- Use deterministic facts before model inference and start context narrow.
- Make planning proportional; do not force a ceremony on small changes.
- Keep the model interchangeable beneath Mavona's own tool/approval/verification loop.
- Separate observed facts, model interpretations and accepted verification.
- Preserve user changes and truthful passed/failed/unknown states.
- Reduce routine approval burden through explicit scoped autonomy.
- Finish the selected product scope; simplify internal implementation rather than silently removing features.

## 3. Ownership and authority

The user owns product intent, acceptance decisions, model/spend selection and external publication, merge, deployment and production actions. Mavona owns discovery, task state, context compilation, execution policy, tool effects, verification execution and persistence. The model proposes implementation and responds to evidence within those boundaries.

Repository configuration and instructions are untrusted inputs. A recommended verifier is not authorized merely because Mavona selected it. Exact-action and scoped-development grants follow `docs/specs/THREAT_MODEL.md`. Running repository code is not intrinsically sandboxed. No secrets in configuration, events or artifacts. Local inference never silently falls back to cloud.

## 4. End-to-end user journeys

### First launch

Install the executable, enter a Git-backed Rails application and run `mavona`. Render the interface immediately while local discovery starts. Resolve multiple Rails roots with a picker. Connect an API, local endpoint or executable official subscription integration, verify capabilities, then focus the composer. Missing dependencies have specific diagnosis and recovery actions; no silent installs.

### Implement a Rails feature

The user asks to let customers reschedule an order. Mavona identifies the relevant route, controller, model, view and tests; follows the existing authorization convention; chooses a direct change or proportional plan; reads files; proposes and applies authorized patches; runs the appropriate checks; exercises the user flow; and presents the diff plus provenance-bearing results. It may make one configured repair attempt after objective failure, within task budgets. It never marks an unrun required check as passed.

### Inspect and direct source changes

Open a referenced file at the exact line, search it, select a range, switch between full source and diff, and attach the selection to a question or change request. Merely viewing code makes no model call. Open the file in the configured editor for manual changes, return, reconcile edits and invalidate stale approvals/evidence without overwriting user work.

### Inspect the running app

Attach to an explicit development/test URL or approve the discovered boot command. Use an isolated test identity, reproduce the flow, capture observations and diagnostics, take over the browser when needed, compare before/after states and rerun saved assertions. Browser evidence supplements repository checks, especially where tests are thin. Confirmation text alone does not establish persisted data correctness.

### Resume and continue

Close or interrupt Mavona. On return, restore the draft, transcript, task, plan and evidence without replaying effects. Reconcile repository changes and unfinished operations before mutation. Compact model context when needed while retaining canonical state and artifacts. Provider/model switches remain explicit and preserve the authoritative task history.

### Run headlessly

Use the same domain workflow through text, JSON or JSONL, with explicit execution policy and spend limits. Refuse unapproved effects in noninteractive mode. Return stable exit semantics for verified, failed, unknown, decision required, cancellation and infrastructure error.

## 5. Required v0.1 capability contract

Every row is required except explicitly capability-dependent integrations. `docs/RELEASE_ACCEPTANCE.md` maps requirements to executable evidence. Supporting specifications own detailed behavior; the matrix below owns scope.

| ID | Required capability | User outcome |
| --- | --- | --- |
| UI-01 | Full-screen OpenTUI/Solid conversation, streaming Markdown/code, expandable tools and clear status | Work comfortably in the terminal |
| UI-02 | Multiline/grapheme-aware composer, paste handling, file completion, command palette, draft retention and cancellation | Direct the agent without input loss |
| UI-03 | Plans, diff review, approval overlays, model/session pickers, themes and keyboard accessibility | Inspect decisions and retain control |
| CODE-01 | Actual file viewer, fuzzy picker, file/line references, highlighting, search, go-to-line, copy/selection and navigation history | Understand the code beyond tool snippets |
| CODE-02 | Revision-labelled source/diff views, selected-line prompts, drift checks and external-editor handoff | Give precise instructions and edit manually |
| RAILS-01 | Git/Rails-root discovery, framework/test/frontend/jobs/database facts and scoped instructions | Understand the application before inference |
| RAILS-02 | Structural parsing, optional runtime probe, incremental discovery and graceful lower-tier fallback | Obtain useful Rails facts even when boot fails |
| RAILS-03 | Evidence-backed surface selection, local conventions, proportional planning and widening | Spend context on relevant work |
| AGENT-01 | Provider-neutral loop, validated tools, read/search/list/patch/command/probe operations and bounded repair | Make actual code changes |
| POLICY-01 | Untrusted configuration handling, exact-action/scoped grants, revocation, containment and effect-safe cancellation | Execute intentionally and preserve user code |
| MODEL-01 | OpenAI and Anthropic native adapters plus compatible presets for DeepSeek, Qwen, Kimi, GLM and OpenRouter | Choose cloud models |
| MODEL-02 | Ollama, LM Studio and configurable compatible endpoints with enforced locality | Use local or self-hosted inference |
| MODEL-03 | Credentials, model discovery/explicit IDs, capability preflight, usage, errors and explicit switching | Connect and operate models predictably |
| MODEL-04 | Official subscription integration where it supplies inference beneath Mavona's loop; exact limitation otherwise | Honest subscription availability |
| APP-01 | App start/attach, isolated browser contexts, login/takeover and policy-bound interactions | Reproduce real Rails user flows |
| APP-02 | Screenshots, DOM/ARIA/text, diagnostics, imports and annotation references | See and explain application behavior |
| APP-03 | Responsive profiles, Chromium/Firefox/WebKit profiles, before/after comparison and reviewed pixel baselines | Inspect browser and visual behavior |
| APP-04 | Saved flows, deterministic assertions, sanitized traces, optional video, reports and rerun | Retain repeatable evidence |
| VERIFY-01 | Relevant verifier selection, progressive widening, actual execution and explicit check provenance | Know what passed and what remains unknown |
| SESSION-01 | Durable events, SQLite projections, history/resume/fork, crash recovery, compaction and retention | Continue long tasks reliably |
| CLI-01 | TUI-equivalent headless workflows, stable output schemas and exit codes | Use Mavona in scripts and CI |
| DIST-01 | Standalone executables, supported-platform validation, dependency diagnosis and complete documentation | Install and use the actual product |

An optional recording feature means the capability ships but recording is opt-in. Browser engines are separately provisioned; full browser support means implemented/tested profiles, not that every user's machine must have all engines installed. No unsupported integration may be presented as working to fill the matrix.

## 6. Rails understanding and task routing

Tier 1 uses TypeScript for filesystem/Git/data-only inspection. Tier 2 extracts declared structure using a measured parser choice: no-boot Prism candidate or Tree-sitter. Tier 3 loads the target Ruby/Bundler/Rails environment only under the execution policy for effective runtime facts. Runtime failure does not erase static evidence. Distinguish declarations from resolved behavior; Ruby config is parsed, not blindly evaluated.

Discovery covers models, controllers, jobs, mailers, channels, components, views, routes, migrations, schema, tests and frontend conventions. Include namespaces, engines and multiple roots in fixtures. Candidate scoring distinguishes primary nomination signals from weak boosts. Low-confidence findings remain inspectable but do not automatically enter the context packet.

Routing returns `PLAN_READY`, `NEEDS_DECISION`, `TOO_BROAD` or `UNSUPPORTED`. Ready tasks use `direct_change`, `lightweight_plan` or `full_plan`. Widen context and verification from evidence. This is a runtime product behavior, not a request to stop implementation pending a benchmark.

## 7. Tools, approvals and context

Implement the narrow tool interfaces in `docs/specs/ARCHITECTURE.md` and the bounded inspection operations in `docs/specs/APP_INSPECTION_SPEC.md`. Calls have stable IDs, runtime-validated arguments, worktree scope, bounded output and cancellation. Patches preserve pre-existing user changes; altered patches invalidate exact approvals.

Repository reads normally proceed within policy. Mutations, boot and repository commands require an applicable action approval or explicitly configured development scope. Show command argv, working directory, relevant environment and effects. Test selection and config precedence never confer trust. Record approval counts/wait and improve repetitive interactions through scoped grants, not blanket bypasses.

Context compilation selects relevant code, evidence, user intent and required constraints within the selected model's limits. Show usage/capacity when known. Compaction preserves accepted requirements, pending effects, decisions and evidence references; it cannot rewrite task truth or silently drop mandatory constraints. Unknown token accounting stays unknown. Exceeding capacity produces a safe checkpoint/recovery path, never fabricated success.

## 8. Evidence and completion

The domain uses runtime-validated discriminated evidence variants: repository fact, convention, impact, verifier recommendation, legibility, verification, app observation and app assertion. Every variant has a typed observation, stable identity, session/task, subject, confidence basis, source/artifact references and provenance. `unknown` belongs at ingestion boundaries, not as an unvalidated internal observation bag. `docs/specs/ARCHITECTURE.md` owns schema/version boundaries.

Executable correctness states are `passed`, `failed`, `unknown`. Not-run, cancelled, missing, stale and errored required checks remain unknown. If any required check fails, the task fails; if none fail but any required check is unknown, completion is unknown; all required checks passing permits verified. Empty verification is not a success shortcut. Show exactly which scope was verified.

Independent execution means the runner records actual outcomes. Independent judgment means acceptance criteria originate outside the implementation agent's self-assessment. Model-proposed checks are diagnostic until adopted through the task's acceptance policy. Existing/configured checks cannot be silently weakened; protected benchmark graders stay structurally outside agent access. Screenshots and visual interpretation alone are not functional proof.

## 9. Provider access and truthful capability limits

Implement all specified API presets through native or compatible adapters, as `docs/specs/PROVIDERS.md` defines. Support explicit model IDs when discovery is unavailable. Credentials come from environment, session memory or Mavona-owned secure storage; never import other clients' private tokens. Separate connected, capability-tested and live-verified status.

Subscription routes require an official documented integration that preserves Mavona's own loop. At implementation time verify availability; implement qualifying integrations. Detection alone remains labelled unavailable for task inference. Missing provider authorization is an external dependency, not grounds to fake support or stop unrelated work.

Images are sent only to an explicitly selected vision-capable route under locality and size policies. Text-only models receive DOM/text/assertion evidence. Viewing images locally never implies model vision. No automatic local-to-cloud fallback.

## 10. TUI and source interaction

`docs/specs/TUI_SPEC.md` owns detailed screen, focus, input, navigation and source-viewer behavior. Conversation is primary, with optional code/evidence drawers on wide terminals and full-width overlays at 80 columns. No permanent IDE dashboard is required. Use OpenTUI components and application-specific composition; do not create a renderer framework or embed a complete editor.

Preserve responsive input during streaming, reader scroll position, focus and drafts. Show locality, model, policy, context and current task state. File viewing is local; attachment submission is explicit and checked for source drift. External-editor return reconciles actual saved files. Mockups guide composition, not exact pixels or proof of terminal capability.

## 11. Full App Inspection

`docs/specs/APP_INSPECTION_SPEC.md` is required in full, including multi-engine profiles, interactions, responsive capture, before/after and baseline comparison, diagnostics, saved flows, login/takeover, sanitized trace/report and opt-in video. The live application appears in a browser; supported terminals show previews, with a local viewer fallback. A screenshot-only tool is incomplete.

Use isolated test data and explicit origins. Browser and Rails-server egress are separate boundaries. No replay of potentially non-idempotent actions after crash without reconciliation. Never overwrite a visual baseline automatically to make a check pass. Compare only compatible capture states; missing profiles or dependencies are visibly unchecked. Packaging must prove actual Playwright driver/engine compatibility.

## 12. Sessions, headless use and distribution

Append-only versioned JSONL is the recovery source; SQLite contains rebuildable projections. Persist draft/task/plan/effects/approvals/evidence/usage; replay without network or tool execution. Unknown safety-critical event versions prevent mutation. Follow `docs/specs/RETENTION.md` for disk budgets, archival and explicit expiry.

Planned entry points: `mavona`, `mavona run`, `mavona inspect`, `mavona resume`, `mavona providers` and `mavona app`. Expose text/JSON/JSONL through the same service. Define concrete exit-code mappings in `docs/RELEASE_ACCEPTANCE.md`. Noninteractive execution requires explicit policy.

Release targets are macOS arm64/x64 and Linux x64/arm64 glibc. Native-platform verification is required before claiming support. Bun, Node and npm are not user installation requirements for the executable; the target Rails app still needs its declared runtime. Browser engines and OS prerequisites are explicitly installed or provisioned. Secure storage availability is diagnosed with environment/session fallback, never plaintext storage. Produce installers, checksums and provenance; sign/notarize where release credentials permit and state any packaging blocker honestly.

## 13. Quality and acceptance

The authoritative completion checklist is `docs/RELEASE_ACCEPTANCE.md`. Every required capability needs implemented behavior, deterministic acceptance and evidence from its relevant environment. Default CI uses local fixtures/stubs and no paid provider. Run explicit live/provider/platform checks when access exists; unavailable checks are blockers for those claims, not invented passes.

Initial measurable targets on named hardware: first render p95 under 1 second; composer event-to-frame p95 under 50 ms during streaming; normal-session resume p95 under 1.5 seconds; representative 100k-line Rails discovery under 30 seconds; bounded memory for 50,000 transcript lines. Define the hardware/fixture/load in results. Test 80×24, resize, Unicode/IME, no-color, long paste, cancellation and recovery. A failed essential usability test is an implementation issue to resolve, not evidence to reduce the product goal.

## 14. Evaluation supports delivery

The small pilot in `docs/specs/BENCHMARKS.md` tests reproducibility, grader quality, examples of benefit/regression and variance. It has no +10pp promotion gate. Missing funds, an inconclusive pilot or incomplete human-authored treatments do not block Rails feature implementation. Investigate concrete correctness/security defects and fix affected behavior; continue independent feature work.

Retain the proposed 10-percentage-point worthwhile effect only for future confirmatory study design. Never claim superiority without an appropriate completed comparison. Product usability and actual task correctness have their own release tests.

## 15. Delivery mandate and boundaries

The implementer proceeds through Milestones 0–7, making tested incremental changes and keeping progress/acceptance status current. A milestone completion is a checkpoint, not a reason to request a new instruction. Spikes choose dependencies and remove technical uncertainty while delivery continues. Document and isolate genuine external blockers, complete other authorized work and resume when resolved.

An opt-in engineering preview can collect feedback under `docs/specs/PREVIEW_POLICY.md`. It does not substitute for full v0.1. Mockup usability reviews can occur from the start.

Outside v0.1: generic non-Rails support, arbitrary native desktop control, swarm orchestration, a hosted inference business, arbitrary plugin execution, production deployment/database mutation and an embedded full IDE. These exclusions do not remove any required capability above.

## 16. Document map

Start with the root README and docs/IMPLEMENTATION_PLAN.md. The contracts in docs/specs/ own their respective domains; docs/RELEASE_ACCEPTANCE.md owns release evidence. Historical review notes, kickoff prompts and mockups are excluded from tracked source; essential decisions are incorporated into these maintained contracts.
