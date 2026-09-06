# Mavona v0.1 acceptance and definition of done

**Status:** Required full release contract · specification revision 5

## Completion rule

Every required PRD capability must be implemented and pass its applicable checks. A missing external integration/platform credential is explicitly blocked, not passed. It does not stop independent implementation. Do not substitute a preview, fake-provider demonstration or benchmark plan for complete v0.1. Comparative uplift is not a release prerequisite; trustworthy product behavior is.

Maintain a ledger per capability with requirement ID, code entry points, test IDs, exact commands, fixture/build/runtime, observed result, artifacts, unresolved issues and external blockers. States: not started, implementing, implemented/unverified, acceptance passed, blocked. Do not mark a feature passed solely because a unit test mocks away its defining behavior.

## Feature acceptance matrix

| Requirements | Required verification |
| --- | --- |
| UI-01–03 | Real streaming transcript; multiline/paste/Unicode/IME input; responsive focus/cancellation; tool details, approvals, plans/pickers, themes and 80×24 resize/recovery PTY checks |
| CODE-01–02 | Open real file from test failure, navigate/search/select, source/diff revision identity, attach/remove draft without provider traffic, detect drift, editor handoff and saved-change reconciliation |
| RAILS-01–03 | Conventional/namespaced/multi-root/boot-failure fixtures, declared/resolved facts, cache invalidation, routing/refusal/widening and parity/fallback coverage |
| AGENT-01 | Live-capable tool loop performs actual read/search/patch/command effects; malformed calls refused; dirty user changes preserved; bounded repair stops correctly |
| POLICY-01 | Hostile config first-use denial, changed config/scripts/flows, scoped grants, revocation, checkout isolation, headless refusal, no unauthorized effects and secret-canary checks |
| MODEL-01–03 | Native OpenAI/Anthropic plus every compatible preset contract; local endpoints; discovery/explicit ID, secure credential/session/env resolution, no fallback, stream cancellation and model switching |
| MODEL-04 | Availability check recorded; supported official route executes beneath Mavona's loop, otherwise explicit unavailable state without token extraction or fake task inference |
| APP-01–04 | All 14 cases in docs/specs/APP_INSPECTION_SPEC.md; actual Playwright/Rails flow, multi-engine/profile tests, comparison/baseline review, diagnostics, trace/report, opt-in video and recovery |
| VERIFY-01 | Known pass/fail/unknown cases, empty/missing checks, widening, stale evidence, assertion provenance and objective persisted-outcome checks |
| SESSION-01 | Close/resume/crash/compaction/replay, unknown critical-event refusal, data migration, retention limits and no automatic effect replay |
| CLI-01 | Same semantic events and results as TUI, noninteractive policy, stable schemas/exit codes and no renderer initialization |
| DIST-01 | Clean-machine install, executable/native/browser assets, target-native startup/task/resume/cleanup, documentation truth and release provenance |

## Required real user scenarios

### A. Rails feature from prompt to verified application

In the canonical Rails app, request customer order rescheduling. Discover local patterns; implement the scoped model/controller/view/test change; authorize effects; run repository checks; operate the browser; assert confirmation and actual persistence for the correct customer; review source/diff and before/after; close and resume. Include failure cases for unauthorized customer access and invalid date. The full pipeline uses real tools and browser execution; model contracts may be deterministic for CI, with at least one separate configured live cloud and one local-model end-to-end demonstration before those paths are declared live-verified.

### B. Failed test repair

Start with a known failing namespaced Rails test. Jump from failure to file/line, inspect evidence, apply a patch, run focused and widened checks when justified, then demonstrate repair-budget exhaustion on a persistently failing fixture. No endless repair loop or false pass.

### C. Manual intervention and drift

Create user edits before launch, open source and hand off to an editor, change a file while a proposal exists, return and reconcile. Reject stale approval and preserve unrelated edits. Recheck affected outcomes. Test terminal and wait-capable GUI-editor adapters through appropriate lifecycle fixtures.

### D. App inspection lifecycle

Start or attach, login/takeover, execute saved flow, change viewport/engine, capture and compare, inspect JS/network errors, export sanitized report/trace and optionally video, cancel and recover without duplicate form submission. Do not kill attached servers. Missing baseline/engine stays unknown; a changed baseline requires explicit review.

### E. Provider and context continuity

Configure credentials through each supported source; use API and loopback providers; test invalid key, quota/timeout, malformed stream, unsupported tools/vision and local redirect refusal. Switch explicitly mid-session, compact a long conversation without losing constraints, resume and verify the same canonical task state. No credentials enter artifacts.

### F. Hostile repository and crash

Clone a fixture with malicious executable config and prove launch performs no unapproved command. Exercise altered scripts, included settings, saved flows, revoked policy and unknown approval event versions. Inject crashes at durable transitions. Required unknown effects/checks never become verified.

## CLI result contract

Use these public exit codes for task-running commands; inspection/status commands report their own documented errors consistently.

| Code | Meaning |
| --- | --- |
| 0 | Verified task completion, or successful explicitly read-only command |
| 2 | Decision/approval required or unsupported task |
| 3 | Required verification failed |
| 4 | Required verification unknown/incomplete |
| 5 | Configuration/provider/dependency failure preventing execution |
| 70 | Internal failure |
| 130 | Cancelled by user |

The final JSON includes schema version, session/task IDs, terminal status, correctness state, check summaries with provenance, artifact references and typed error/decision if any. For JSONL, emit ordered domain events and a final result event when possible; stdout contains no interactive decoration or secrets. Logs go to stderr. A transport disconnect may prevent final emission; exit/recovery evidence must remain honest.

## Platform and provider claims

Target macOS arm64/x64 and Linux x64/arm64 glibc. Record actual OS/build/terminal/Ruby/Bun/browser versions. Unsupported hosts remain a concrete release blocker for that matrix row; continue other work and supply CI automation. Test packaged runtime assets on the target, not only cross-compilation. Browser binaries are explicit separate dependencies, with doctor/install/offline-cache paths.

Every API preset must pass stub/contract behavior. Track actual live-tested model/provider combinations separately, because provider accounts and endpoints change. At least one real native cloud path and one real local path must complete the canonical tool task for full v0.1 acceptance. Unavailable third-party access is not grounds to fabricate support. Subscription capability remains conditional on official availability as the PRD states.

## Release artifacts and documentation

Produce executable builds, installer/Homebrew inputs, checksums/provenance, applicable signing/notarization, README install/config/use/troubleshooting, headless examples, credential/locality explanation, browser setup, recovery/export/retention guidance, contributor rules and known limitations. Validate user instructions against clean installs. Publish only with the user's existing authorization or final approval; preparing artifacts is part of delivery.

Map the supplied conversation, code review and App Inspection mockup views to real implemented workflows; keep the input mockups outside tracked source. Mockup labels or static success counters are not release evidence.

## Evaluation and external feedback

Product acceptance runs do not wait for the human-authored benchmark pilot. Correctness/security regressions found by any evaluation remain bugs to fix. Comparative superiority requires a separately completed suitable experiment. Obtain early mockup/demo usability feedback without repository execution; runnable previews follow docs/specs/PREVIEW_POLICY.md. Neither is a reason to stop before full v0.1 delivery.

## Implementation ledger — 2026-09-06

Baseline: master `fdee113`; implementation branch `codex/mavona-v0.1`. No feature has full release acceptance. Each detailed specification scenario remains required.

| ID | State | Implementation / checks / remaining evidence |
| --- | --- | --- |
| UI-01 | implementing | Initial renderer/source/session/truth primitives; full acceptance pending. |
| UI-02 | implementing | Initial renderer/source/session/truth primitives; full acceptance pending. |
| UI-03 | not started | Required full contract pending. |
| CODE-01 | implementing | Initial renderer/source/session/truth primitives; full acceptance pending. |
| CODE-02 | implementing | Initial renderer/source/session/truth primitives; full acceptance pending. |
| RAILS-01 | implementing | Initial offline discovery/toolchain slice in progress; no release pass. |
| RAILS-02 | not started | Required full contract pending. |
| RAILS-03 | implementing | Initial routing or compatible transport primitives; full acceptance pending. |
| AGENT-01 | not started | Required full contract pending. |
| POLICY-01 | not started | Required full contract pending. |
| MODEL-01 | implementing | Initial routing or compatible transport primitives; full acceptance pending. |
| MODEL-02 | implementing | Initial routing or compatible transport primitives; full acceptance pending. |
| MODEL-03 | implementing | Initial routing or compatible transport primitives; full acceptance pending. |
| MODEL-04 | not started | Required full contract pending. |
| APP-01 | not started | Required full contract pending. |
| APP-02 | not started | Required full contract pending. |
| APP-03 | not started | Required full contract pending. |
| APP-04 | not started | Required full contract pending. |
| VERIFY-01 | implementing | Initial renderer/source/session/truth primitives; full acceptance pending. |
| SESSION-01 | implementing | Initial renderer/source/session/truth primitives; full acceptance pending. |
| CLI-01 | implementing | Initial offline discovery/toolchain slice in progress; no release pass. |
| DIST-01 | implementing | Initial offline discovery/toolchain slice in progress; no release pass. |

### Evidence M0-baseline

Native host: Darwin arm64, Ruby 4.0.6, Bundler 4.0.16. Historical source extracted from `fdee1136acd7863885ed20c6760f61674f7e32c5` into `/tmp/mavona-ruby-baseline-QnndTO`, outside active checkout. Full deterministic suite: 90 tests, 526 assertions, zero failures/errors/skips, seed 27302, 7.049849 seconds, exit 0. Raw commands/results: `/tmp/mavona-ruby-baseline-QnndTO/BASELINE-EVIDENCE.md` and `baseline-test.log`. The first environment attempt selected system Ruby 2.6; the second explicitly selected Ruby 4.0.6. No source changes or paid calls. This establishes an observed oracle; 50-pair parity and smoke semantics port remain pending.

### External evidence blockers

Paid cloud verification: no spending budget supplied. Local model, other native platform hosts and signing access: not established. No live provider, browser, release signature or cross-platform support is claimed. Continue implementation and deterministic checks independently.

### Evidence M0-static — initial implementation, not full feature acceptance

Code: `packages/rails/discovery.ts`, `packages/tools/source.ts`, `packages/cli/main.ts`, `apps/mavona/main.ts`. Tests: `tests/discovery.test.ts`, `tests/cli.test.ts`. RAILS-01, CLI-01, DIST-01 remain implementing; CODE-01/02 now have tested read/selection primitives but no viewer acceptance.

Darwin arm64, Bun 1.4.2, TypeScript 7.0.2. Commands used the development Bun directory on PATH:

- `bun test tests/discovery.test.ts` before implementation: exit 1, missing discovery module (expected red).
- `bun test`: exit 0, 8 tests, 33 assertions; hostile startup config remains inert, root ambiguity, containment/exclusion, UTF-8 source selection/drift, binary/size refusal and CLI truth checked.
- `bun run typecheck`: exit 0, TypeScript 7 strict.
- `bun run build`: initial exit 127 (Bun missing from script PATH), then exit 0 with corrected PATH.
- `env -i PATH=/usr/bin:/bin dist/mavona --version`: exit 0, `mavona 0.1.0-dev.1`.
- `MAVONA_TEST_BINARY=$PWD/dist/mavona bun test tests/cli.test.ts`: native packaged fixture inspection/refusal checks; results recorded with this slice.

No provider request, browser execution or Rails boot occurs in this slice. Structural parsing, full instruction scope, cache, routing/parity, interactive source viewing and runtime facts remain required. The user-supplied Ruby deletions remain unstaged; retirement acceptance has not passed.

### Evidence M0/M1-runtime — renderer and persistence foundations

Code: `packages/protocol/events.ts`, `packages/domain/task.ts`, `packages/sessions/store.ts`, `packages/tui/`, `scripts/build.ts`. No milestone is yet complete.

On Darwin arm64 / Bun 1.4.2 / TypeScript 7.0.2 / OpenTUI 0.5.10 / Solid 1.9.12:

- `bun test tests/session.test.ts` before implementation: exit 1, missing module.
- `bun test`: 17 passed, 1 packaged-only test skipped, 61 assertions, exit 0. Includes real native renderer Unicode/multiline bracketed paste and resize, event replay/duplicate conflicts, incomplete-tail recovery, SQLite rebuild, writer exclusion, unreconciled/unknown-event refusal and secret canary redaction.
- `bun run typecheck`: exit 0 with strict and library declaration checking enabled after the documented dependency declaration patch. Earlier attempts failed on upstream declarations; see ADR 002.
- `bun run build`: exit 0, embeds native renderer plus SQLite path. Initial packaged launch failed on development preload; compile now disables target bunfig/dotenv/tsconfig/package autoload.
- `MAVONA_TEST_BINARY=$PWD/dist/mavona bun test tests/cli.test.ts`: 3 passed, 10 assertions, exit 0, including hostile repository preload refusal.
- `python3 scripts/pty-smoke.py dist/mavona`: exit 0, real packaged startup/input/paste/80×24→60×18 resize/Ctrl+C cleanup, original termios restored. Isolated HOME, PATH only /usr/bin:/bin.

This is an initial local inspection UI, not a streaming coding preview. Plans, approvals, provider streams, comprehensive source controls/editor handoff, crash lock reconciliation, full draft recovery/retention and performance acceptance remain incomplete. UI currently opens a new session; resume/fork are not exposed. No unsupported event may authorize effects.

### Evidence M2/M3-foundations — routing and compatible transport

`packages/rails/routing.ts` and `tests/routing.test.ts`: deterministic subject/path nominations, weak-candidate exclusion, bounded context, direct/light/full routing and explicit unsupported/ambiguous/unmatched/broad outcomes. Candidate identity is checkout/root/path-derived and independent of display text/order. `mavona inspect PATH --task TEXT` exposes routing without inference; its exit code still describes the read-only inspection, while routing has its own typed status. This corrects the observed v1 empty-scope readiness defect, but the reviewed 50-pair parity manifest remains outstanding.

`packages/providers/{security,sse,compatible}.ts` and `tests/providers.test.ts`: compatible HTTP transport with bounded UTF-8/SSE decoding, text/tool/usage normalization, credential-source precedence, config secret rejection, explicit local/remote endpoint enforcement, redirect refusal and cancellation. This transport is not yet wired into a production agent loop and does not implement the full provider interface; native adapters, presets, preflight, secure-store platform implementations and image contracts remain required.

Actual checks on Darwin arm64 / Bun 1.4.2:

- Initial provider test: exit 1, missing implementation module (red).
- `bun test tests/providers.test.ts`: 6 passed, 23 assertions, exit 0. Actual local HTTP stub, split UTF-8, malformed records and in-flight cancellation; no external inference.
- `bun test tests/routing.test.ts`: 7 passed, 21 assertions. The first implementation overnominated generic path terms; corrected before acceptance of this slice.
- `bun run typecheck`: exit 0 after integration.
- `bun run build`: exit 0.
- `MAVONA_TEST_BINARY=$PWD/dist/mavona bun test tests/cli.test.ts`: 4 passed, 14 assertions, exit 0, including task routing and hostile preload isolation.

Provider implementation sources checked: [official Chat Completions reference](https://developers.openai.com/api/reference/resources/chat) and [Ollama compatibility](https://docs.ollama.com/api/openai-compatibility), retrieved 2026-09-06. These describe wire primitives and do not establish live compatibility for Mavona.
