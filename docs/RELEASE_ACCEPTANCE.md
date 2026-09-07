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
| AGENT-01 | implementing | Actual source/tool/verification loop and approved App Inspection integration tested; deterministic compaction and one objective repair attempt tested; full canonical scenarios pending. |
| POLICY-01 | implementing | Canonical worktree ownership, durable effect guard, exact grants, drift/refusal and secret boundaries tested; full adversarial matrix pending. |
| MODEL-01–03 | Native OpenAI/Anthropic plus every compatible preset contract; local endpoints; discovery/explicit ID, secure credential/session/env resolution, no fallback, stream cancellation and model switching |
| MODEL-04 | implementing | Official subscription capability assessed; explicit unsupported own-loop state implemented without token extraction. |
| APP-01–04 | All 14 cases in docs/specs/APP_INSPECTION_SPEC.md; actual Playwright/Rails flow, multi-engine/profile tests, comparison/baseline review, diagnostics, trace/report, opt-in video and recovery |
| VERIFY-01 | implementing | Independent verifiers, exact acceptance adoption and stale/unknown truth tested; one objective repair attempt tested; progressive widening and full canonical outcomes pending. |
| SESSION-01 | implementing | Durable replay, lifecycle, configurable opt-in retention and crash effect guard tested; full migration/crash/recovery matrix pending. |
| CLI-01 | implementing | Native headless/event projections tested, including source, browser and evaluation paths; complete command/UX parity pending. |
| DIST-01 | implementing | Darwin arm64 binary/native/parser/browser/viewer assets tested; local installer/provenance/SPDX inventory prepared and tested; signing, full bundled inventory and all-host evidence pending. |

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

## Implementation ledger — current 2026-09-07

Baseline: master `fdee113`; implementation branch `codex/mavona-v0.1`. No feature has full release acceptance. Each detailed specification scenario remains required.

| ID | State | Implementation / checks / remaining evidence |
| --- | --- | --- |
| UI-01 | implementing | Streaming Markdown, bounded history rendering and expandable tool/verification cards implemented; full cross-host PTY/performance matrix pending. |
| UI-02 | implementing | Multiline composer, paste, committed IME Unicode, fuzzy selection, draft retention and cancellation tested; cross-host accessibility matrix pending. |
| UI-03 | implementing | Approvals, source/diff review, root/file/model/session pickers and persisted terminal themes implemented; full plans and remaining picker acceptance pending. |
| CODE-01 | implementing | Real Ruby-highlighted source navigation, fuzzy picker, selection/copy and pins tested, including native PTY; full acceptance pending. |
| CODE-02 | implementing | Anchored revisions/diffs, prompt references, drift checks and native editor handoff tested; full historical/recovery UI acceptance pending. |
| RAILS-01 | implementing | Static Git/Rails facts, explicit multi-root scope and instructions implemented; full declared/resolved fact matrix pending. |
| RAILS-02 | implementing | No-boot versioned Prism structure/route probe and cache implemented; older/container Ruby and full runtime tier pending. |
| RAILS-03 | implementing | 50 observed legacy projection pairs and reviewed routing differences pass; full profile parity, widening and protected smoke outcomes pending. |
| AGENT-01 | implementing | Actual source/tool/verification loop and approved App Inspection integration tested; deterministic compaction and one objective repair attempt tested; full canonical scenarios pending. |
| POLICY-01 | implementing | Canonical worktree ownership, durable effect guard, exact grants, drift/refusal and secret boundaries tested; full adversarial matrix pending. |
| MODEL-01 | implementing | Native/compatible provider contracts and all specified presets implemented; paid live demonstrations remain unverified. |
| MODEL-02 | implementing | Loopback/custom endpoint contracts implemented; full local-model demonstration and connection UX pending. |
| MODEL-03 | implementing | Credential precedence, secure-store transports, discovery/preflight and usage/error contracts tested; full picker/switching UX pending. |
| MODEL-04 | implementing | Official subscription capability assessed; explicit unsupported own-loop state implemented without token extraction. |
| APP-01 | implementing | Real lifecycle, isolated auth, interactions, scoped coding-loop flow, headless attach/start, and live terminal attach/start/log/capture/takeover/resume/stop implemented; cross-host lifecycle/recovery matrix pending. |
| APP-02 | implementing | Masked captures, bounded DOM/ARIA hints, diagnostics, imports and annotations tested; exact current-task image/model selection now tested; complete evidence review workflow pending. |
| APP-03 | implementing | All three engines and nine responsive profiles tested with real touch; diagnostic comparison and exact reviewed baseline workflow implemented; measured repeatability and full matrix pending. |
| APP-04 | implementing | Saved flows, canonical assertions/observations, constrained trace, masked checkpoint video and packaged offline viewer tested; canonical Rails flow passes all engines on macOS, full cross-host matrix pending. |
| VERIFY-01 | implementing | Independent verifiers, exact acceptance adoption and stale/unknown truth tested; one objective repair attempt tested; progressive widening and full canonical outcomes pending. |
| SESSION-01 | implementing | Durable JSONL/replay, lifecycle, retention and crash effect guard tested; full migration/compaction/recovery matrix pending. |
| CLI-01 | implementing | Native headless/event projections tested, including source, browser and evaluation paths; complete command/UX parity pending. |
| DIST-01 | implementing | Darwin arm64 binary/native/parser/browser/viewer assets tested; local installer/provenance/SPDX inventory prepared and tested; signing, full bundled inventory and all-host evidence pending. |

### Evidence M0-baseline

Native host: Darwin arm64, Ruby 4.0.6, Bundler 4.0.16. Historical source extracted from `fdee1136acd7863885ed20c6760f61674f7e32c5` into `/tmp/mavona-ruby-baseline-QnndTO`, outside active checkout. Full deterministic suite: 90 tests, 526 assertions, zero failures/errors/skips, seed 27302, 7.049849 seconds, exit 0. Raw commands/results: `/tmp/mavona-ruby-baseline-QnndTO/BASELINE-EVIDENCE.md` and `baseline-test.log`. The first environment attempt selected system Ruby 2.6; the second explicitly selected Ruby 4.0.6. No source changes or paid calls. This establishes an observed oracle; 50-pair parity and smoke semantics port remain pending.

### External evidence blockers

Paid cloud verification: no spending budget supplied. Local model, other native platform hosts and signing access: not established. No live provider, release signature or cross-platform support is claimed. Browser evidence is recorded in subsequent slices. Continue implementation and deterministic checks independently.

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

### Initial verification checkpoint

`bun install --frozen-lockfile`: exit 0, no lock changes. `bun test`: 31 passed, 1 packaged-only skip, 109 assertions, exit 0. `bun run typecheck`: exit 0. Separate native packaged CLI suite: 4 passed / 14 assertions. The existing Ruby production CI is replaced by Bun test/build/native-smoke jobs and an immutable historical characterization job. Workflow sources are pinned for checkout/setup-bun; CI has not run remotely and provides no Linux/native acceptance evidence. No push or publication occurred.

Required UI, agent, policy, Rails parity, native provider, session recovery, browser and distribution scenarios remain incomplete. See the implementation plan's concrete continuation checkpoint. All capability states above remain honest partial states; foundational tests are not product release acceptance.

### Provider adapters and durable session lifecycle — implementation evidence, 2026-09-07

Native Responses and Messages adapters, compatible presets, bounded capability preflight/model discovery, structured tool assembly, explicit locality, sanitized image references, secure-store/session/environment credentials and official-subscription unavailable states are now implemented under `packages/providers/`. Tests use local HTTP stubs or fake secure-store executables. No paid/live provider compatibility is claimed.

Session lifecycle now includes read-only catalog/export, explicit resume/fork, immutable checkpoints, retention tombstones and SQLite-backed writer ownership that survives process death. Pending effects remain unknown on replay. Required UI integration and full crash/retention matrices remain incomplete.

Actual command: `bun test tests/providers*.test.ts tests/session*.test.ts tests/tools-runtime.test.ts tests/agent-loop.test.ts tests/cli.test.ts tests/tui*.test.ts*` on Darwin arm64, Bun 1.4.2: 48 passed, one packaged-only skip, 216 assertions, exit 0. This covers these libraries plus the following integration slice; it is not full release acceptance. Typechecking the entire working tree currently encounters concurrent unfinished browser extensions; rerun after that slice is integrated.

### Rails structural probe and executable Rails fixture — 2026-09-07

`packages/rails/{probe,instructions,cache}.ts` and versioned `probes/rails_probe.rb` implement bounded no-boot Prism 1.8.1 extraction, instruction ancestry and digest invalidation. Ruby environment/preloads are isolated, unavailable parsing stays unknown, malformed or arbitrary executable diagnostics cannot become evidence. `fixtures/rails-dogfood/` is an actual Rails 8.1.3.1 / Ruby 4.0.6 / Turbo / Stimulus application with isolated SQLite test storage and customer-scoped rescheduling. It is a development fixture, not a second product runtime.

Commands on Darwin arm64: `bun test tests/discovery.test.ts tests/rails-probe*.test.ts tests/rails-dogfood.test.ts tests/routing.test.ts`: 23 passed, 94 assertions, exit 0. Additional diagnostic-hardening regression initially failed with a forwarded canary; after the allowlist fix, `bun test tests/rails-probe.test.ts`: 6 passed, 15 assertions, exit 0. Reviewed parity and the complete Rails/context contract remain implementing.

`/Users/daryl/.local/share/mise/installs/ruby/4.0.6/bin/ruby fixtures/rails-dogfood/bin/check`: actual Rails suite, 7 runs / 32 assertions / zero failures, errors or skips, seed 11280, exit 0. SQLite persistence, authorization and validation are executed rather than mocked.

### Policy-bound coding loop and terminal/headless integration — 2026-09-07

`packages/tools/{policy,runtime}.ts` enforce exact-action or explicit scoped execution, configuration/entry-script identity, revocation, one mutable worktree lease, digest-bound replacement, bounded argv commands, stripped process credentials and cancellation. `packages/agent/loop.ts` owns actual provider/tool requests, durable effect intent/result, capability/budget gates and independently sourced required verification. Missing checks, pending effects and model prose cannot promote correctness.

The CLI now performs configured tasks and exposes session list/show/export/fork/archive/resume. The terminal controller uses the same loop, persists draft edits, shows explicit provider/model/locality, streams events, traps approval focus and cancels without clearing the draft. This is partial UI delivery: complete source/diff/editor, connection wizard/pickers, planning and inspection drawers remain required. The test runner now explicitly preloads the supported Solid transform, and a reactive render-update regression proves it executes.

Actual checks on Darwin arm64: controller tests were red on missing module before implementation; session CLI test was red on unavailable dispatcher before implementation. `bun test tests/tui.test.tsx`: 2 passed / 11 assertions. `bun test tests/cli.test.ts`: 4 passed / one packaged-only skip / 17 assertions, including actual local HTTP inference protocol → approved file patch → independent subprocess verification preserving a pre-existing user edit. `bun test tests/session-cli.test.ts`: 1 passed / 13 assertions. No paid model calls occurred.

`bun run typecheck`: exit 0 after browser API integration. `bun run build`: exit 0. Earlier native packaged CLI suite after loop integration: 5 passed / 20 assertions; `python3 scripts/pty-smoke.py dist/mavona`: exit 0, input/paste/resize/Ctrl+C cleanup and original termios restored. Required all-platform, long-session and complete product matrices are still implementing.

After adding session dispatch, rebuilt and ran `MAVONA_TEST_BINARY=$PWD/dist/mavona bun test tests/cli.test.ts tests/session-cli.test.ts`: 6 passed / 33 assertions / zero skips, exit 0, including compiled export/fork/resume with no effect replay.

### Credential process-argument hardening — 2026-09-07

macOS secure-store writes now use `security -i -q` with correctly quoted private stdin, retaining environment/session/secure-store precedence and scoped deletion. Linux already used stdin. The system `security(1)` manual and harmless interactive `help` commands verified whitespace, quote, backslash, semicolon and dollar-sign argument handling without writing real credentials. A new regression failed on the previous secret-bearing argv; after correction, `bun test tests/providers-credentials.test.ts`: 4 passed / 17 assertions, exit 0. Only fake secure-store writes were performed.

### App Inspection, native provisioning and source navigation — 2026-09-07

`packages/app-inspection/` now contains the actual Playwright service, loopback policy proxy, owned-server lifecycle, protected authentication state, decoded PNG comparison and offline report/viewer. Flow approval binds the checkout, origin and complete step digest. Stable page/frame identities, fresh observations, explicit popup/frame/dialog/upload/download actions, manual takeover, expiry/revocation, masked captures, annotations and opt-in operation recordings are implemented. Downloads currently accept bounded sanitized UTF-8 text; unsupported formats refuse. At this checkpoint raw trace/video sanitization was still pending; the constrained recorder and embedded viewer evidence below supersede that limitation. APP-01–04 remain implementing.

The CLI and terminal expose doctor and exact-flow review/run. The CLI explicitly provisions browsers using the pinned upstream registry. Session events retain browser intent/result and managed report paths. CLI cancellation leaves possible application effects unknown. Source controls now provide snapshot-preserving line navigation, literal search, range selection, history, wrap, refresh and removable persisted context references; stale references block task submission before inference. Complete highlighting/diff/editor, pickers and drawers remain required.

Actual evidence on Darwin arm64, Bun 1.4.2, Playwright 1.63.0:

- Agent-owned `bun test tests/inspection.test.ts tests/inspection-advanced.test.ts tests/inspection-images.test.ts`: 25 passed, 113 assertions, zero failures. Actual Chromium/Firefox/WebKit, blocked redirect/frame/popup/WebSocket egress, isolated auth reuse, secret canaries, upload drift, post-submit cancellation with exactly one effect, annotated imports and deterministic pixel differences.
- Compiled `scripts/inspection-spike.ts`, then each engine from `/tmp` with PATH `/usr/bin:/bin`: exit 0; actual assertions, capture, sanitized download, operation recording and explicit auth reuse. No Node/Bun runtime required.
- Browser CLI test first failed on missing dispatcher; after implementation, actual approved Chromium flow passed. Compiled browser CLI plus local-archive IPC download-worker regression: 2 passed / 10 assertions, exit 0.
- Empty isolated-cache native Firefox provisioning initially failed on the upstream fork entry. After the tracked packaging patch, the standalone binary downloaded Firefox1543/FFmpeg1011 and ran a real assertion/capture using that cache from `/tmp` with only `/usr/bin:/bin` on PATH. Report: `/var/folders/qv/y41q9l852bs87_2gxkh7cfwh0000gn/T/mavona-native-browser-run-l51siiei/data/sessions/01a07789-8942-7197-8b55-5a02d7ad5d0c/artifacts/01a07789-8947-71fc-91c3-fa20a8722100/report.html`.
- `bun scripts/rails-browser-acceptance.ts` with Ruby4.0.6 on PATH: 3 passed / 12 assertions, all engines against an owned real Rails/Turbo/Stimulus server with independent read-only SQLite checks for saved date/customer scope. Server cleanup completed. The previous development server was stopped. Future dates derive from the test date and the unchanged customer is compared against a pre-run database observation.
- `bun install --frozen-lockfile`, `bun run typecheck`: exit 0. Full `bun test`: 103 passed / 5 explicitly conditional skips / 468 assertions. The conditional Rails and packaged cases passed separately. Later added source-line render regression initially exposed pre-layout scroll clamping; applying the native scroll after layout fixed it. `bun test tests/tui.test.tsx`: 3 passed / 15 assertions; source line40, stable snapshot/draft and background rendering covered.

CI now explicitly provisions Rails fixture gems and all engine dependencies, runs real Rails browser acceptance, and tests the packaged browser worker. Linux lockfile variants were resolved without changing locked gem versions; registry checksums are now recorded. CI has not executed remotely. See ADR003 for native constraints and patch ownership. None of these slices establishes full v0.1 acceptance or signing/publication support.

### Repository drift, source diffs and external editor handoff — 2026-09-07

`packages/tools/repository-state.ts` fingerprints bounded allowed files, Git HEAD/index and file modes without invoking hooks, external differs or content filters. Pre-existing edits are labelled separately from changes observed during work. Resumed task mutation refuses changed repository state before another model request; explicit `/reconcile` invalidates old checks and grants without clearing unknown effects. A new regression exposed a verifier that mutated source yet left correctness passed; source drift now makes those checks stale/unknown.

`packages/tools/{source-diff,source-navigation,editor}.ts` and terminal integration add revision-digested source/diff switching plus explicit argv editor adapters. Diff line numbers cannot become source selections. The editor holds the worktree lease through terminal delegation or explicit GUI return, preserves the displayed snapshot, reconciles saved changes and revokes grants/verification. A failed partial suspension still restores the terminal. This is not complete CODE/UI acceptance: syntax highlighting, full picker/selection/copy controls, historical diff breadth and remaining responsive interaction cases are outstanding.

Actual checks: new repository/editor modules initially failed as missing, source diff initially failed as unavailable, and source-mutating verification initially incorrectly passed. After implementation, `bun test tests/editor-handoff.test.ts tests/repository-state.test.ts tests/agent-loop.test.ts tests/source-diff.test.ts tests/source-navigation.test.ts tests/tui-controller.test.ts tests/tui.test.tsx`: 18 passed / 86 assertions, exit 0. `bun run typecheck` and `bun run build`: exit 0.

`python3 scripts/pty-editor.py dist/mavona`: actual system Vim in the compiled TUI, exact-action approval, saved file modification, returned repository snapshot, stale verification marker and restored original termios; exit 0. A guardian process observes terminal modes before PTY session teardown. `python3 scripts/pty-editor.py dist/mavona --cancel`: targeted SIGINT cancels the actual Vim subprocess, records unknown effect truth, returns to usable TUI and restores original termios; exit 0 after fixing a real cleanup failure. A killed Vim had left raw modes behind; the narrow Unix handoff now captures `/bin/stty -g` after renderer suspension and restores that state before resuming. During native editing, the editor owns its keyboard controls. CI includes both native PTY paths but has not run remotely.

### Anchored creation, patching and recoverable deletion — 2026-09-07

The coding loop exposes approved create_file/delete_file alongside digest-bound apply_patch. Checkout and parent identities are bound to preparation; native directory descriptors refuse symlink traversal and outside hardlinks, creation is exclusive, and deletion retains original bytes in private recovery storage. See ADR004 for the small C ABI bridge and actual packaging failures corrected during verification. Recovery UI and full adversarial/platform acceptance remain implementing.

Actual commands: `bun test tests/file-mutations.test.ts tests/tools-runtime.test.ts tests/agent-loop.test.ts`: 15 passed / 49 assertions. `bun run typecheck`, `bun run build`: exit 0. `MAVONA_TEST_BINARY=$PWD/dist/mavona bun test tests/cli.test.ts`: 6 passed / 27 assertions / zero skips, including native creation and deletion with a local HTTP provider and independent `/bin/test` check from a temporary working directory with only system executables on PATH. No external compiler, Node or Bun executable is needed by that packaged lifecycle case. Native tests initially failed on virtual C-source loading; private temporary materialization fixed it.

### Bounded session storage and log drift — 2026-09-07

Canonical history and checkpoint reads now enforce the 128 MiB read bound before allocation, open without following leaf symlinks, and require single-link regular files. Session directories, writer markers, databases and their journal/WAL/SHM files are checked before write ownership. Incomplete trailing recovery truncates the already-open canonical descriptor. Active append refuses externally changed log identity, size or modification time and refuses exceeding the readable history budget. Complete malformed records remain untouched.

Regressions first demonstrated oversized writer replay, linked outside-file modification and append after external edits. After correction, `bun test tests/session-files.test.ts tests/session.test.ts tests/session-lifecycle.test.ts tests/session-retention.test.ts tests/agent-loop.test.ts`: 20 passed / 91 assertions, exit 0. `bun run typecheck`: exit 0. This is partial recovery evidence; full disk-full/crash-point, checkpoint replay performance and cross-session worktree reconciliation acceptance remain outstanding.

### Cross-session unfinished-effect recovery — 2026-09-07

The worktree lease now commits a separate pending-effect record before approved command, file or browser execution. It clears only after canonical result persistence; unknown outcomes survive close and process death. Editor lifecycle also holds this guard through its canonical return records. Another session cannot bypass the pending effect by starting a new task. CLI/TUI check the guard before model capability preflight and identify the owning session/effect.

Explicit `sessions reconcile ID --effect EFFECT_ID --reason ...` and terminal `/effects` / `/reconcile EFFECT_ID explanation` record acknowledgement of inspected current state. Replay preserves the original unknown outcome, records reconciliation separately and invalidates prior verification. Only the owning session clears its worktree guard, after canonical acknowledgement is durable. A crash between these steps remains conservatively blocked and can be reconciled again; no effect is replayed.

Actual evidence: SIGKILL of a real lease-owning subprocess left its committed effect and blocked another session. New regression first failed on absent guard APIs. Targeted recovery/agent/TUI/session CLI/editor suite: 18 passed / 76 assertions, exit 0. Full offline `bun test`: 126 passed / 5 explicit conditional skips / 575 assertions / zero failures. This full run preceded the final preflight-diagnostic test; that test passed in the targeted suite and made zero requests to its local provider stub. `bun run typecheck`, `bun run build`: exit 0. Packaged CLI/session/browser tests: 10 passed / 52 assertions. Actual `python3 scripts/pty-editor.py dist/mavona --cancel`: exit 0, usable return and original termios restored. Complete crash-point, performance and all-host acceptance remain implementing.

### Native source highlighting, fuzzy file picker and explicit copy — 2026-09-07

The source viewer now uses OpenTUI's parser worker, code renderer and line-number component with the bundled MIT Ruby grammar described in ADR005. It retains revision snapshots, selection markers and a no-colour form. The native `/files` / Ctrl+P picker performs bounded fuzzy path matching with stable identities; keyboard selection does not submit the composer. `/copy` or Ctrl+Shift+C explicitly requests copying a selected source range through the terminal's OSC52 API; it reports unsupported clipboard capability without claiming success. Clipboard delivery beyond the terminal request has not been independently observed.

New module tests first failed as absent; the controller copy regression failed before its implementation. After correction, `bun test tests/tui.test.tsx tests/tui-controller.test.ts tests/file-picker.test.ts tests/source-highlighting.test.ts`: 11 passed / 49 assertions, exit 0. `bun run typecheck`, `bun run build`: exit 0. Compiled `scripts/source-highlighting-spike.ts` ran under an empty environment with PATH `/usr/bin:/bin` from `/tmp`, producing 12 Ruby captures. `python3 scripts/pty-source.py dist/mavona`: exit 0, actual fuzzy picker, Ruby/Unicode snapshot, preserved draft, zero provider/tool events, 80-to-140-column resize and original termios restored. `python3 scripts/pty-editor.py dist/mavona`: exit 0, actual Vim save/return still passes. CI includes these paths but has not run remotely. Remaining source pin/responsive pane/history breadth and long-session acceptance are still implementing.

### Long-session rendering measurement — 2026-09-07

Named host: Apple M5 Pro, 24 GiB RAM, Darwin arm64, Bun 1.4.2. `bun scripts/session-performance.ts` seeded 50,000 canonical events: 96.8 ms reopen, 2.10 ms append p95 across 30 appends, approximately 310 MB process RSS. No session projection refactor was needed for this measured case.

`bun scripts/tui-performance.tsx` initially exhausted native SyntaxStyle handles with one renderable per message. A single text buffer avoided that failure but measured 295.7 ms composer event-to-frame p95 under streaming, so that approach was replaced. The native transcript retains all message identities/text in 250-message render chunks and rebuilds only changed chunks, using the existing OpenTUI scroll viewport. After structured Markdown/tool cards exposed and corrected another handle-exhaustion regression, the rich renderer is bounded to the latest 500 items and explicitly expanded chunks; older history remains compact copyable text. Three consecutive isolated 50,000-message, Unicode, 80×24 runs on the named host measured 222–265 ms initial render and 37.6–42.3 ms p95 including the stream update, composer event and frame across 20 samples, with approximately 354–362 MB process RSS. The script fails above the 1 second/50 ms targets. These are one-host measurements, not an all-platform or sustained-load guarantee.

`bun test tests/tui.test.tsx`: 5 passed / 21 assertions, including preservation of a manually chosen reading position through new output and explicit Ctrl+End jump to latest. No transcript content is discarded or model context changed by rendering. Remaining resize/IME/long-task and native-platform performance evidence is still required.

### Responsive source pane, pins and read containment — 2026-09-07

At 120+ columns the source is a separate pane capped at 40% of the terminal; `/pane 20–40` adjusts its width. Narrow terminals show the full-width source overlay while retaining the mounted transcript and reading position. Closing the overlay restores that position and composer focus. `/pin`, `/pins` and `/unpin ID` persist stable file identities and requested line positions through canonical events. Reopening a changed pin labels the new worktree snapshot rather than treating it as old evidence. Pins do not attach code to inference.

A new source-read regression demonstrated that a hardlink could expose bytes outside the selected checkout. Source reads now require a single-link regular file and recheck link count before returning. The new responsive and pin regressions also failed before implementation. `bun test tests/discovery.test.ts tests/tui.test.tsx tests/tui-controller.test.ts tests/session.test.ts`: 28 passed / 110 assertions, exit 0. `bun run typecheck`, `bun run build`: exit 0. Full source-view acceptance still includes additional historical references, text-selection/clipboard terminal capabilities and remaining interaction details.

### Repository verifier selection and acceptance integrity — 2026-09-07

`packages/verification/selection.ts` reads bounded, contained `.mavona.yml` verification mappings and includes before falling back to task-evidenced Minitest/RSpec checks or labelled broader framework scopes. Candidates have stable identities, argv/cwd, scope, rationale, required status, timeout and criterion digests. Mixed frameworks remain separate checks. CLI inspection exposes recommendations, and the task loop selects them when explicit checks are absent. Every actual execution still uses the existing approval policy; configuration cannot approve itself.

A regression initially reported passed after an implementation agent replaced an existing acceptance assertion with `assert true`. The loop now detects changed pre-existing test/spec criteria and captured configuration/helper digests before executing final checks, invalidates verification and returns `acceptance_changed` with unknown correctness. Explicit review/adoption workflow remains required; this stop does not declare the changed tests accepted.

Actual `bun test tests/agent-loop.test.ts tests/verifier-selection.test.ts`: 10 passed / 34 assertions, exit 0, including a real configured subprocess check selected automatically and separately approved. `bun run typecheck`: exit 0. A separate regression demonstrated concurrent mutation ownership in two Rails subdirectories of the same Git worktree; lease and pending-effect lookup now resolve the enclosing worktree. `bun test tests/worktree-recovery.test.ts tests/tools-runtime.test.ts`: 10 passed / 26 assertions. Nested-root context/UI selection, complete verifier adoption and 50-pair parity remain implementing.

### Selected Rails roots and scoped configuration — 2026-09-07

The CLI and TUI normalize ownership to the enclosing Git worktree while retaining the explicitly selected Rails application. Multiple applications require the native root picker or an explicit CLI root. Source paths and persisted references stay repository-relative; verifier commands execute in the selected app. Root/app verification configuration is inherited deterministically, and exact-action approvals bind settings along the selected execution path. Changing a nested application configuration invalidates its prepared approval.

Actual `bun run typecheck`: exit 0. Full offline `bun test`: 143 passed / 5 explicit conditional skips / 638 assertions / zero failures, 34 files. Packaged `MAVONA_TEST_BINARY=$PWD/dist/mavona bun test tests/cli.test.ts tests/session-cli.test.ts`: 9 passed / 48 assertions / zero skips, including selected-app context and actual independent subprocess verification. `python3 scripts/pty-source.py dist/mavona --multiple-roots`: exit 0, native root selection followed by fuzzy Ruby/Unicode source navigation, preserved draft, no inference, resize and restored terminal modes. Other native hosts remain unverified.

### Explicit acceptance adoption across retries — 2026-09-07

Acceptance file identities and sanitized before/after review text are captured before inference and retained in canonical session events. Added, removed or changed test/spec files and selected criterion files require an exact review. Repository reconciliation and another task cannot silently replace that baseline. Terminal review/adoption and `sessions adopt ID --review SHA256 --reason ...` bind the entire current repository fingerprint and acceptance digests; drift refuses adoption. Active terminal tasks can present the same exact review. Adoption invalidates verification and performs no command; checks still require execution authority and actual fresh results.

The new retry regression initially returned verified after a changed assertion. After implementation, `bun test tests/agent-loop.test.ts tests/session-cli.test.ts tests/tui-controller.test.ts`: 18 passed / 93 assertions; this preceded the final terminal adoption regression. That regression and session/selection coverage passed in a later 21-test / 84-assertion run. `bun run typecheck`, `bun run build`: exit 0. Packaged CLI/session suite: 10 passed / 53 assertions / zero skips. Tests cover explicit before/after review, no additional model request on unresolved retry, drift during approval, wrong review IDs, and adoption with unknown correctness and no effect execution. Full VERIFY/AGENT acceptance remains implementing.

### Frozen 50-pair routing corpus and parsed route evidence — 2026-09-07

`parity/` now retains 50 distinct task/fixture declarations, immutable pinned Ruby observations/raw artifacts, a versioned normalizer/projection, hash manifest and reviewed exact divergences. Capture checked the archived legacy library bytes against `fdee1136acd7863885ed20c6760f61674f7e32c5`. Three initial nested-root observations failed because the observer passed the enclosing Git root into the legacy analyzer; those failures remain preserved, alongside successful second observations using the selected application root. No legacy production code was changed and no specification fallback is claimed.

The corpus exposed an omitted explicit custom-directory source and missing declared-route nominations. Task inspection now runs the existing bounded no-boot Prism adapter for route files, retaining literal resource declaration line/digest provenance. Comments, unrelated receiver calls and dynamic names cannot become effective runtime route claims. Cache query version is now 2. Explicit source paths rank first, other primary task matches next, then parsed declared-route relationships. Broader proportional plans retain the restored affected surfaces.

Actual strict `bun scripts/parity/verify.ts`: exit 0, 50 observed-v1 cases, 77 individually recorded deliberate changes/legacy defects, zero unresolved comparison differences. This is projection acceptance, not full RAILS/PARITY acceptance: the pinned smoke repositories, protected grader semantics, broader profile/structure comparison and actual older/container/runtime matrix remain required. See parity/README.md for normalization, observer correction, review identity and coverage limits. Inherited Ruby deletions remain unstaged.

Actual `bun test` after route integration: 199 passed / 5 conditional skips / 879 assertions / zero failures, 35 files, 21.23 seconds. `bun run typecheck`, `bun run build`: exit 0. Subsequent packaged CLI suite: 8 passed / 36 assertions / zero skips, including the embedded Prism probe with actual configured Ruby, no Bun/Node executable on PATH, hostile inherited RUBYOPT ignored, declared route provenance and no app-code execution. CI includes strict parity verification but has not run remotely.

### Protected smoke fixtures and offline evaluation runner — 2026-09-07

All nine historical task definitions, graders/support and three pinned repository declarations are preserved byte-for-byte under evaluation/smoke, with a checked provenance manifest. The development-only runner prepares clean detached copies, enforces an OS filesystem boundary for the agent, freezes post-exit source state and grades a separate fresh checkout. It retains partial file changes after agent failure, denies inherited credentials/network, bounds processes/output/snapshots and preserves passed/failed/not_run/error. Changing pre-existing test helper foundations is an explicit disqualifier before grader execution. See evaluation/README.md for setup, scope and remaining acceptance.

Actual Darwin arm64 `bun test tests/evaluation.test.ts`: 8 passed / 47 assertions / zero failures. Real subprocess checks cover allowed own-file writes, denied protected direct/symlink/child-process reads, zero local HTTP requests, bounded timeout, clean pinned input despite a dirty source checkout, separate independently executed grading, partial failed-agent changes and no grading after failure/helper tampering. The initial sandbox profile aborted before launch; adding the required literal filesystem-root loader read enabled normal execution while protected file reads still received Operation not permitted. No broad home/private-directory read permission was added.

Nine v1 pure result-normalization observations were captured with Ruby4.0.6. The old reducer accepted a passed payload despite a nonzero grader process exit; the replacement deliberately records error/unknown for that contradiction. Other recorded outcome semantics and paired-report cells are retained, with explicit attempt identities and unknown counts. `bun scripts/evaluate.ts --catalog` and `bun run typecheck`: exit 0.

Linux namespace code and pinned Ubuntu bubblewrap provisioning are present in CI but have not run on a native Linux host. The actual inherited Rails graders require Ruby3.2.1/4.0.0/4.0.2, while this host currently has3.4.10/4.0.5/4.0.6; those pinned setups and nine behavioral outcomes remain unverified. Live inference is disabled and no paid budget exists. Full smoke, RAILS/PARITY and Ruby retirement acceptance remain implementing.

### Constrained Playwright trace and masked checkpoint video — 2026-09-07

Flow evidence flags and CLI --trace/--video are part of the exact reviewed flow digest. The pinned Playwright1.63.0 in-process recorder is guarded before startup: trace events use an allowlist, arbitrary argument/result/error/source/DOM/console/network payloads are omitted before persistence, resource sinks are disabled except explicitly masked checkpoint PNGs, and client source-stack collection is disabled. Hook incompatibility fails closed. Genuine upstream ZIP export is bounded and loaded with Playwright's offline TraceLoader before the artifact can pass. Per-context hooks are restored after export; concurrent cancellation shares cleanup. Report links validate managed paths.

Optional video uses masked JPEG screenshots at flow checkpoints and the already-managed Playwright FFmpeg executable. Native raw browser video is never enabled. The report explicitly labels the result a checkpoint sequence at2fps without preserving pauses; continuous sampled video is not claimed. Encoding has bounded frames/bytes/time, private output and cleanup. Trace/video artifact success remains separate from required functional assertions.

Actual inspection regression run:30passed,1conditional packaged-worker skip,180assertions, zero failures across five files. Subsequent native packaged CLI plus trace suite:7passed,73assertions, zero skips/failures. This includes actual Chromium/Firefox/WebKit trace export and upstream offline loading; password/private-page/query/console/cookie canaries absent from trace payloads; real encoded WebM decoded by FFmpeg with masking pixels retained; exact CLI recording approval; native compiled trace/video recording; partial trace on concurrent cancellation with correctness unknown. Strict typecheck and native build exit0. Browser execution tests use the existing installed engines and require no network or paid inference.

The integrated offline upstream trace-viewer UI, continuous-video semantics if required, all-host native coverage and the full14-case App Inspection acceptance matrix remain implementing. This slice does not mark APP acceptance passed.

### Embedded offline upstream trace replay — 2026-09-07

The exact pinned Playwright Trace Viewer assets plus its Apache license/notice now compile into the native executable. `app replay --trace-file PATH` owns a foreground loopback server; `/app replay PATH` owns one TUI viewer until replacement, `/app stop`, cancellation or exit. The server reads one bounded no-follow, single-link immutable archive snapshot, validates that snapshot, uses an unpredictable path and denies foreign host/origin, non-read methods and unrelated paths. It exposes no filesystem endpoint or forwarding API. CSP limits embedded viewer networking to its own origin. Application contexts continue blocking service workers; trusted viewer verification alone permits them behind the enforcing same-origin proxy.

Actual rendered replay exposed a gap in the preceding trace slice: upstream action loading and frame metadata succeeded while checkpoint PNG files were absent because disabling native screencast also skipped directory creation. The recorder now explicitly creates the safe image directory. Archive validation requires referenced checkpoint PNG bytes, and actual viewer tests decode the displayed filmstrip image. The earlier loader-only checks did not establish image replay. Trace/video now share the overall per-inspection artifact budget.

Actual native macOS arm64 `MAVONA_TEST_BINARY=$PWD/dist/mavona bun test tests/inspection-viewer.test.ts tests/inspection-cli.test.ts tests/inspection-trace.test.ts tests/tui-controller.test.ts`:17passed,135assertions, zero skips/failures. Packaged replay ran from an unrelated temporary directory with PATH=/usr/bin:/bin; its embedded UI displayed actions and decoded checkpoint images. Source/TUI start-stop, CLI SIGTERM cleanup, immutable managed archive, foreign host/origin and unrelated-path refusal passed. The browser verifier recorded zero external requests. Strict typecheck, native build and targeted diff check passed. Full14-case inspection and cross-host acceptance remain implementing.

### Named responsive profiles and touch interaction — 2026-09-07

Desktop/tablet/mobile profiles now set viewport, pixel ratio, touch and mobile layout explicitly. Profile, browser, color-scheme and reduced-motion CLI overrides participate in the exact reviewed flow digest; named profiles reject conflicting arbitrary viewport overrides. The shared report and captures retain selected settings, context-start availability and other unchecked profiles. The TUI prints profile coverage. Imported screenshots retain unknown runtime provenance. `tap` is a scoped semantic action subject to the existing exact argument approval.

Initial tests incorrectly inferred touch support from navigator.maxTouchPoints and expected an obsolete Firefox isMobile rejection. Actual pinned Firefox/WebKit returned zero maxTouchPoints, while their runtime implements touch/mobile options. The corrected defining test injects a real semantic tap and independently asserts the page's touchstart outcome, with desktop separately asserting mousedown. All nine Chromium/Firefox/WebKit × desktop/tablet/mobile combinations pass viewport, pixel ratio, dark scheme, reduced-motion and real input assertions. No real-device or accessibility claim is made.

Actual targeted native CLI/profile/TUI run:20passed,105assertions, zero skips/failures. The compiled CLI ran a reviewed mobile/dark flow with trace and masked video. Strict typecheck and build exit0. Actual full offline `bun test`:224passed,6conditional skips,1057assertions, zero failures across39files in28.65seconds. The full-suite skips include externally enabled Rails fixtures and packaged-only cases; the targeted packaged run exercised its relevant skipped cases separately. Full inspection and v0.1 acceptance remain implementing.

### Bounded rendered DOM/ARIA hints and selected geometry — 2026-09-07

`observe` accepts an optional unique semantic locator and emits a structured rendered DOM projection alongside visible text. Records have observation-owned UUIDs and parent references, tag/role hints, allowlisted ARIA/type attributes, geometry and disabled state. The traversal excludes form values, raw HTML, scripts/styles, handlers and private/hidden ancestor subtrees, including selected elements under private shadow hosts. It covers open shadow roots, caps traversal depth/nodes/attributes/text, labels truncation and explicitly disclaims a complete accessibility audit. Mutation revision is captured in the same browser evaluation as the evidence, closing the previous inter-evaluation drift window. Reports expose the structured hints as escaped untrusted data.

Per-run observations now cap at200records and4MiB, preserving collected evidence and refusing further reads at the limit. The initial large-DOM/privacy fixture failed before implementation. Actual subsequent native CLI plus DOM/base/advanced/trace suites:33passed,535assertions, zero skips/failures. All three engines exercise real selected geometry, parent identities, truncation, password/private/hidden/shadow/handler canaries, browser policy and masked trace behavior. A200-observation real-browser test confirms the next read is refused while prior evidence and unknown correctness are preserved. Packaged CLI exposes structured heading evidence. Strict typecheck and native build exit0. Complete agent browser-tool integration and full inspection acceptance remain implementing.


### Coding-loop inspection authority and durable browser evidence — 2026-09-07

The actual coding loop now exposes inspect_app through the shared Playwright service. Model assertions are normalized to model-proposed before review, so forging user-approved/protected-grader provenance cannot establish correctness. Review binds exact flow, checkout, configuration and repository fingerprint and is revalidated immediately before launch. The task lends only its matching open worktree lease; the same durable pending-effect guard applies. Missing/stale approval starts no browser. Terminal approval reviews the concrete flow; headless --allow-inspection-flow reads and rechecks a saved flow and consumes one authorization per occurrence. Raw browser argument values/query strings are omitted from canonical proposal events.

Sanitized app_observation/app_assertion events now persist collected and not-run checks, with inspection/step identities and full structured evidence. Recording no longer depends on whether a live event subscriber exists. Agent output is a bounded diagnostic projection; full local reports are linked in task artifacts. Model-selected checks remain diagnostic, and independent repository checks still decide task correctness.

Actual native targeted CLI/agent/inspection/session/TUI run:46passed,218assertions, zero skips/failures. A deterministic provider performed actual read/patch, real browser inspection of changed source and an independent process verifier while preserving a pre-existing edit. This used a local application stub, not the full Rails canonical scenario. Denied/stale approval produced zero browser requests; forged provenance stayed unknown; failure after POST preserved one submission and blocked continuation. Native CLI saved-flow tests refused repeat authorization and file changes before launch. Strict typecheck and native build exit0. Full canonical Rails+TUI user journeys, vision selection and all inspection acceptance remain implementing.

### Explicit terminal connections and native model picker — 2026-09-07

The terminal now offers guided connection categories, explicit unavailable subscription guidance, custom endpoint/locality selection and a bounded searchable model catalogue. `/connect provider model [URL local|remote]` validates endpoint and model identity. `/models` requests metadata only; selection makes no inference request, preserves draft/references and revokes stale grants. A canonical non-secret selection survives controller/session reopening; disconnect is durable. Discovery failure retains the prior explicit selection and explains explicit-ID setup. The full secret-entry wizard remains pending; credential values must never be entered in the composer.

A new rejected-endpoint test exposed URL userinfo persisting in an invalid command draft. Shared session text redaction now removes URL userinfo and sensitive query tokens before canonical/projection storage and display. Endpoint validation still refuses userinfo, query/hash and non-loopback local targets; rejected selection never replaces the existing locality.

Actual terminal/model/session suites:18passed,89assertions, zero failures. The real TUI controller used an owned local compatible HTTP endpoint for model discovery, explicit model selection, synthetic capability preflight, model-proposed browser flow, actual terminal approval and real browser evidence. With no independent verifier configured, task correctness remained unknown. Reopening retained the selected model; disconnect cleared it. Native `python3 scripts/pty-models.py dist/mavona`: passed metadata-only GET, keyboard filtering/selection, no inference,80×24→60×18 resize and original terminal-mode restoration. Its first attempt sent input before renderer readiness; the harness now waits for actual discovery/render readiness before interacting. Strict typecheck/build/diff check passed. CI includes the new native model/viewer/agent paths but has not run remotely.

Actual `bun scripts/rails-browser-acceptance.ts`:3passed,12assertions, zero failures, using the owned Rails8.1.3.1/Turbo/Stimulus fixture and independent SQLite persistence/authorization assertions across all three engines. The helper stopped its owned server. This is the existing browser-flow scenario, not yet the entire prompt-to-Rails-code canonical scenario.


### One objective repair attempt with shared budgets — 2026-09-07

The task loop now permits at most one configured repair pass after a required, fresh, non-model-proposed verifier exits nonzero. The same session/task/worktree lease, provider/model, grants, acceptance baseline and global turn/tool/time budget continue. Verifier executions now count toward the tool budget. Actual bounded failure evidence goes back to the model; prior checks become stale and independent checks rerun after repair. Missing, unknown, cancelled or stale evidence cannot trigger repair. Permanent failure returns failed with repair-budget evidence; criteria edits still require exact acceptance adoption. `--repair-attempts0|1` and durable `/repair0|1` configure the limit; default1. Canonical task.repair.started events and TUI status expose the attempt.

The initial defining suite had3expected failures before integration. Actual subsequent native agent-repair/agent-loop/agent-inspection/TUI-model/CLI run:33passed,179assertions, zero skips/failures. It repaired an actual source defect and independently verified the result while preserving the prior edit; permanent failure made exactly one further model pass; disabled CLI/TUI policies made no extra inference; exhausted turns and unknown command outcomes did not repair; weakened test criteria were blocked for adoption. Strict typecheck, native build and targeted diff check passed. Full compaction/widening and canonical release scenarios remain implementing.

### Deterministic context compilation and bounded retrieval — 2026-09-07

The coding loop now locally compacts older complete assistant/tool exchanges when the conservative input budget is reached. Task text, scoped instructions, selected source constraints and verifier definitions stay pinned; canonical result IDs, repository digest, acceptance event and check freshness survive the checkpoint. Persisted metadata contains hashes rather than raw browser proposals. Whole-line reads retain the full source digest; bounded current-task result retrieval preserves Unicode boundaries. Duplicate call IDs across turns are rejected before a second result/effect. Pinned constraints that cannot fit still stop with context_limit. The terminal displays compaction and headless JSONL carries the same versioned event.

The defining large-file regression failed before implementation and then passed actual ranged reads, a digest-checked patch, preservation of prior edits and independent verification over six provider turns. Four focused context tests passed with47assertions, including privacy, pinned overflow and scoped Unicode retrieval. Thirteen context/loop tests passed with86assertions including cross-turn duplicate IDs. Strict typecheck passed. The broad offline run passed249tests with1571assertions and6conditional skips; it preceded the final budget-accounting and duplicate-ID test additions. Full session recovery/compaction continuity and canonical release scenarios remain implementing.

Final native build and targeted context/loop/repair/CLI/TUI run passed37tests,198assertions, zero skips/failures after the budget-accounting change. This verifies the local Darwin arm64 binary only.

### Coding-loop no-boot probe and instruction widening — 2026-09-07

The agent can request parse_ruby for up to8explicit Ruby paths using the existing isolated, versioned Prism adapter. It cannot supply an executable or request application boot. Results label syntactic provenance and unknown effective runtime state. Ranged source reads and parser requests merge newly encountered instruction ancestry into pinned context. The outdated architecture statement that parser selection was still pending now points to the existing measured ADR003 decision; broad parser-performance acceptance remains pending.

The defining provider→actual Prism regression failed before implementation, then received real declarations without executing hostile top-level File.write and retained the service-specific instruction outside its initial model surface.14probe/context tests passed with87assertions; strict typecheck passed. The final native build and agent-probe/context/CLI run passed13tests with91assertions and zero skips/failures. Runtime boot probing remains unimplemented; this slice does not claim RAILS-02 or AGENT-01 complete.

### Native command palette and argument entry — 2026-09-07

Ctrl+P now opens the command palette specified by TUI_SPEC; /files remains the file search entry. Stable catalog IDs drive filtering and generated help. Argument-bearing commands collect input in the picker and reuse existing controller/approval paths. Palette execution preserves the composer draft. Ctrl+D opens the revision-labelled diff; Ctrl+R exposes declared Rails evidence with runtime unchecked. This does not complete the remaining session picker, full semantic-keybinding or accessibility matrix.

The controller regression failed before implementation. The final controller/palette/model run passed11tests with72assertions; strict typecheck and native build passed. Actual80×24 native PTY command and source workflows passed: Ctrl+P filtering/argument entry, unchanged unfinished draft, no model request, cancel,60×18resize and restored terminal modes. CI now includes the command PTY script; remote CI has not been run.

### Terminal session picker and writer transfer — 2026-09-07

Ctrl+O and /sessions expose a bounded200-ID local picker with archive and pending-effect labels. Filtering and selection use stable session IDs. The destination writer and reconstructed controller are acquired before the current writer is released; active tasks cannot switch. Drafts remain canonical, owned viewers stop, discovery refreshes, and the existing resumed event invalidates verification without replaying effects. Unsupported/corrupt destinations remain unavailable. Listing supports an optional bound without changing the CLI's unbounded catalog contract; very large-catalog responsiveness is still unverified.

The initial missing-picker regression failed. Strict typecheck and native build passed. Native targeted session/palette/lifecycle/CLI/controller tests passed15tests,87assertions. Actual80×24 native Ctrl+O test passed locked-destination refusal, successful retry after lock release, editable retained destination draft, preserved original draft, transferred writer ownership, no effect replay, pending command still unknown, stale verification,60×18resize and terminal cleanup. The initial raw-output assertion expected a full string despite differential rendering; the corrected test checks rendering plus actual edited composer persistence. Remote CI has not run.

The locked-destination regression also exposed an error message hidden by the narrow picker layout. The picker now displays the unavailable/retry state in its title. Its controller regression passed9assertions, and the native locked-destination retry test passed after this fix.

### Explicit approved Rails runtime observations — 2026-09-07

A separate versioned Rails-runner script reports resolved route metadata, selected Active Record association/column declarations and in-checkout loader paths. It runs only through the task's existing exact command approval, clean test environment, bounded process group and durable effect guard. The script is copied privately and removed after use. Model names are bounded and cannot supply Ruby or an executable. Boot may execute initializer effects; this is disclosed and is not a sandbox. Missing, malformed or interrupted results remain unknown. Valid runtime observations explicitly retain correctness unknown.

The TUI uses its exact-action review. Headless --allow-runtime-probe JSON_MODELS grants one matching model-list request under the initial settings digest; absent/mismatched/reused authorization refuses before boot. No runtime model/provider switching or gem installation is performed by this tool.

The missing-module test failed before implementation; the actual Rails fixture initially exposed an incorrect test column expectation (scheduled_at versus the real scheduled_on), corrected against observed schema. The actual approved/denied loop, private request, malformed/timeout and native headless exact/one-use grant tests passed. Final native runtime/context/no-boot run:12passed,97assertions, no skips/failures; strict typecheck and native build passed. Full container/older-Ruby runtime, broad parity and cancellation/recovery acceptance remain implementing.

### Actual pinned smoke application baseline characterization — 2026-09-07

Mise installed the original Ruby3.2.1/4.0.0/4.0.2 binaries after checksum and GitHub artifact-attestation verification. Clean checkout caches at /tmp/mavona-smoke-cache-20260907 use the exact three catalog commits. With private HOME and no inherited credentials, bundle installation completed for all three applications. Lobsters' first SQLite native build failed; the catalog's explicit --enable-system-libraries setting fixed it. All test database preparation commands completed. The demo public-index grader initially errored because application.css was missing; installing from its original yarn.lock and running its existing JS/CSS build scripts produced the needed assets. No application behavior or protected grader was changed.

All original graders then reached actual behavioral assertions on the pinned baseline:

| Task | Observed result |
| --- | --- |
| demo_comment_length |2runs,5assertions,1failure,0errors |
| demo_post_title_normalization |2runs,3assertions,2failures,0errors |
| demo_public_post_index |2runs,9assertions,2failures,0errors after asset setup |
| lobsters_message_subject |1example,1failure |
| lobsters_notify_message_idempotent |1example,1failure |
| lobsters_tag_json |1example,1failure |
| ffcrm_account_name_normalization |2examples,1failure |
| ffcrm_task_literal_search |1example,1failure |
| ffcrm_website_job_url_safety |1example,1failure |

Each original grader exited1 with failed/failed. The original support's [-6000..] slice returned null notes for shorter outputs; an external Open3 observation wrapper retained real child stdout/stderr without changing arguments, results or grader bytes. Raw private observations are in /tmp/mavona-smoke-baseline-20260907; commands/setup logs are /tmp/mavona-smoke-*. These are application/grader baseline characterization runs, not protected end-to-end agent evaluation, nine Mavona successes or comparative uplift. The evaluation runner still needs a reproducible prepared-worktree path before full inherited-task evaluation; live model budget and non-Darwin hosts remain unavailable. Ruby retirement is not accepted.

The broad offline suite preceding the runtime-probe addition passed253tests,1598assertions,6conditional skips, zero failures across47files. Later runtime/native evidence is recorded above.


### Local native distribution preparation — 2026-09-07

The native build writes a fingerprinted build record; packaging refuses changed binary bytes, source/build inputs, target or toolchain. The packager produces a native archive, exact SHA256SUMS, dirty-state/build provenance, SPDX2.3 installed-dependency inventory, notices, local install/remove scripts and a target-guarded Homebrew formula input with a placeholder URL. Package metadata hashes are explicitly labelled metadata hashes, not archive checksums. Signing/notarization remain unperformed. Bun's embedded third-party internals are not independently enumerated, so the inventory does not claim completeness or release readiness.

The installer regression failed before implementation. Final native distribution tests:4passed,21assertions, zero failures; an earlier native distribution/CLI run passed11tests,54assertions. These cover clean-prefix startup, checksum mismatch, wrong target, symlink refusal, existing-file preservation, modified binary preservation, removal, dependency metadata without package execution and stale provenance refusal. Strict typecheck and native builds passed. The actual generated archive was verified, unpacked and installed in an isolated prefix, ran --version with only /usr/bin:/bin, and removed without deleting session/browser data or parent directories. The latest archive checksum and formula Ruby syntax also passed.

The first SPDX document used a wrong document-comment property; it was corrected to the official2.3schema's comment property. The latest115-package inventory passed the official SPDX2.3Draft7schema, unique-ID and relationship-reference validation using jsonschema4.25.1 installed solely in /tmp/mavona-spdx-validator. It adds no product runtime dependency. Sources: [SPDX2.3schema](https://github.com/spdx/spdx-spec/blob/v2.3/schemas/spdx-schema.json), [validator release/license](https://pypi.org/project/jsonschema/4.25.1/).

Local output: /tmp/mavona-package-20260907-3/mavona-0.1.0-dev.1-darwin-arm64.tar.gz, SHA256 a80dbeafbc3aa4bde768c99fcc045226e4c7ae295245f69ca89dd5ab3a03b50c. Provenance honestly records sourceDirty=true because inherited Ruby deletions remain unstaged and this slice was being implemented. See distribution/README.md for exact local instructions and signing/distribution limitations. No artifact, formula or release was published. Homebrew installation, signature/notarization, other-native-platform testing and full v0.1 acceptance remain unverified. CI inputs were updated but remote CI has not run.


### Current-task image selection evidence

The coding loop catalogs only live masked inspection captures and exposes select_inspection_images with exact ID/digest/dimensions/provider/model/endpoint/locality review. Browser approval does not authorize image submission. A terminal /vision on capability override is explicit, scoped to the current model selection and cleared on switching/resume. Four distinct captures per task are bounded by existing request byte/pixel limits; imports and persisted report claims never enter the catalog. Image reads refuse hard links, drift and containment changes before any provider request. Canonical events retain approval metadata, never base64. Visual judgement remains advisory.

Actual browser → masked PNG → local HTTP provider, approved/denied coding-loop selection with multiple tool calls, altered review, changed bytes, hard-link refusal, all three adapters, and terminal override/reset checks passed. `bun test tests/tui-models.test.ts tests/agent-image-selection.test.ts tests/providers-images.test.ts`:8passed,88assertions at the initial checkpoint; final targeted image checks after added tampered-review/hard-link cases:5passed,53assertions. Strict typecheck, macOS arm64 build and diff check passed. Full default suite:268passed,6conditional skips,0failed,1704assertions across50files. This does not claim paid-model compatibility or the complete headless image-selection UX/14-case browser acceptance.


### Headless image approval evidence

`--allow-image-sha256` validates one to four distinct exact PNG digests before inference, explicitly enables vision for the command's unchanged selected route, and consumes each digest once after current-task selection. Browser-flow grants remain separate. Absent/mismatched grants send no images; changed settings deny selection. Two distinct captures of identical bytes cannot consume one digest grant twice. Invalid input follows the existing CLI error exit5 and makes no provider request.

Actual rebuilt macOS arm64 binary: `MAVONA_TEST_BINARY=$PWD/dist/mavona bun test tests/agent-image-cli.test.ts tests/agent-inspection.test.ts`:12passed,86assertions,0failed/skipped. These tests ran the compiled command with real browser captures and owned local HTTP providers; source prechecks and strict typecheck also passed. No live-provider compatibility or full browser acceptance is implied.

### Inspection checkpoint provenance and canonical capture records

Observations and captures now carry harness-owned session/task association, sampled repository commit/dirty fingerprint, actual browser/profile/OS, sanitized page/frame/title and explicit unknown environment/fixture fields. Imported images retain unknown runtime/repository provenance. A versioned inspection.artifact event records the managed relative path and hash immediately after masked capture persistence. Reopening replays metadata without browser effects. Repository sampling is not an atomic database/application snapshot and does not verify functionality.

The new provenance fixture exposed malformed canonical JSON after textual URL redaction consumed closing punctuation. Session persistence now redacts parsed JSON values recursively with a depth bound, preserving serialization and path-keyed metadata; ordinary text and known secret values remain sanitized. No original bytes are written before redaction.

Actual full suite after the fix: `bun test`:275passed,6conditional skips,0failed,1774assertions across52files (46.60s). Targeted provenance/redaction:10passed,48assertions. Strict typecheck passed. Real browser checkpoints span a repository change; capture identity survives reopen without requests, title/query canaries are absent, nested JSON remains parseable, imports retain unknown provenance. APP-02/04 remain implementing pending the complete review, lifecycle and acceptance matrix.

### Sanitized request timing evidence

The inspection service records up to200 request identities with page/frame/step association, sanitized bounded URL, method/resource type, HTTP status, transport outcome and available Playwright timing fields. Missing timing is null; unfinished requests remain unknown. HTTP500 may complete transport and stays a distinct HTTP diagnostic. Count truncation is explicit and independent of the error diagnostic budget. No headers, cookies or request/response bodies are read. The offline report displays timing, and the coding loop receives bounded recent requests and error diagnostics.

Actual Chromium/Firefox/WebKit delayed POST/HTTP500/blocked-request fixtures, metadata count/unknown boundaries, agent browser and provenance tests:12passed,115assertions,0failed. Rebuilt native macOS arm64 `MAVONA_TEST_BINARY=$PWD/dist/mavona bun test tests/inspection-cli.test.ts tests/agent-image-cli.test.ts`:7passed,59assertions,0failed/skipped. Header/body/cookie/query canaries were absent from reports across all three engines. Strict typecheck and diff check passed. Timing is observational and does not verify application behavior.

### Native terminal inspection evidence drawer

/app, /app history and /app show ID project bounded canonical summaries, assertions, observations and capture metadata by stable inspection identity. The text drawer labels historical/partial status, current verification unknown, model provenance and expired captures; it makes no inference, browser or filesystem-read request. Malformed evidence stays unavailable, and terminal controls are stripped. Source/composer state survives closure; other commands restore their relevant surface. A sanitized inspection.summary event supports the same evidence in headless sessions.

Controller/model/palette checks:6passed,62assertions,0failed. Rebuilt macOS arm64 `python3 scripts/pty-inspection.py dist/mavona` passed with actual native browser capture → session resume →80×24 drawer, keyboard scrolling, unfocused composer protection,60×18 resize, retained editable draft, zero browser replay and restored terminal modes. Native command/source PTY regression checks also passed. Strict typecheck and diff check passed. CI now includes the native drawer and image CLI checks; remote CI was not run. Live browser lifecycle controls, external report/export and comparison/rerun review remain outstanding.

### Immutable full-resolution local report viewer

A canonical inspection.report manifest binds each asset's stable ID, managed path, media type, size and SHA256. The viewer validates single-link regular files and lexical/resolved containment, refuses drift/expiry, and serves an immutable bounded snapshot behind an unpredictable loopback path. Exact Host/Origin, GET/HEAD, no-script/no-connect CSP and an explicit asset map prevent unrelated file routes. Full-resolution captures are linked from the HTML. Report JSON and authentication material are excluded. Expiry matches artifact identity plus digest, so identical bytes belonging to another artifact are unaffected.

TUI /app report uses the selected drawer run; /app stop or session exit closes the owned viewer. Headless app report --session ID --inspection ID reads canonical history without acquiring a writer or modifying events; SIGTERM shuts down cleanly. Old runs without manifests remain unavailable for this view rather than trusting unverified HTML.

Actual rebuilt macOS arm64 report/browser CLI tests:5passed,43assertions,0failed/skipped. Real inspection-service browser display, byte-exact images, immutable loaded bytes after on-disk tampering, symlink/hardlink/traversal/expiry refusal, request policy and unchanged canonical log passed. Controller/viewer checks:5passed,45assertions. Latest full suite:284passed,6conditional skips,0failed,1868assertions across55files (50.76s). Strict typecheck and diff check passed; remote CI not run. Export, comparison/rerun and live lifecycle controls remain outstanding.

### Explicit portable report export and complete keyboard review

Export previews exact stable asset IDs, hashes, sizes, redaction status and destination. Missing historical redaction metadata is unknown. Only the immutable report bundle and portable manifest enter the tar.gz; report JSON and authentication state are excluded. Current destinations must be outside Git worktrees/session storage, separating artifact copying from mutable coding tasks. Source integrity, parent identity and destination absence are checked after approval. Bun's bundled archive implementation and anchored file descriptors create a private temporary sibling, publish without replacement, and verify final bytes. Intent/result events preserve passed versus interrupted/unknown export outcomes without replaying the operation. No upload occurs.

The approval panel now owns a bounded scrollable viewport with PgUp/PgDn/Home/End, independently tested at80×24 and60×18. Short approvals retain conversation visibility; command-driven work displays working status. Actual source renderer/report/export tests:12passed,85assertions,0failed. Compiled macOS arm64 export checks:2passed,29assertions at the native CLI checkpoint. Final rebuilt `python3 scripts/pty-inspection-export.py dist/mavona` passed exact manifest scrolling, denied/no-write, approved portable archive, draft preservation, no browser replay, resize and terminal cleanup. Strict typecheck and diff check passed. Cross-host and injected disk-full/crash export acceptance remain unverified; comparison/rerun and live browser controls remain outstanding.

### Exact retained-source restoration

Canonical deletion completion IDs identify retained source. Terminal /recover and headless sessions recovery/restore preview exact checkout, paths, hash, size, mode and current repository/settings/event fingerprints. Approved restoration owns the worktree, records a durable effect and uses an anchored no-replace move. A concurrent destination remains untouched; ambiguous results block mutations until explicit reconciliation and a new review. Successful restoration preserves bytes/mode and invalidates prior verification. Preview and picker make no inference requests.

Actual source and compiled macOS arm64 recovery tests:6passed,48assertions,0failed. Native pty-recovery.py passed real agent deletion, stable picker selection, denial/approval, byte/mode/draft preservation, zero inference on recovery, resize and terminal cleanup. Strict typecheck, native build and diff check passed. Latest full suite:293passed,6conditional skips,0failed,1952assertions across57files (54.09s). Permanent disposal, orphan/interrupted original deletion discovery and the full crash/platform matrix remain implementing.

### Separately reviewed permanent retained-source removal

Terminal /dispose and headless sessions dispose require an exact current irreversible-removal preview. Private recovery directory identities, original retained hash/mode, checkout, settings and repository fingerprints are bound to approval. The owning lease and canonical intent precede staging to a random private path; verified staged bytes are removed through unlinkat and parent fsync. Success leaves a stable recovery-ID/hash tombstone. Recreated application source remains untouched. Interrupted operations record both possible paths and remain unknown; explicit reconciliation and unambiguous file inspection are required for a new review. No archive/expiry policy removes source.

Defining test first failed on absent implementation. Source and compiled macOS arm64 restoration/disposal suite:12passed,86assertions,0failed, including actual move followed by injected cancellation and fresh-review recovery. Native pty-disposal.py passed exact denied/approved removal, retained draft/current source, no inference, resize and terminal cleanup; pty-recovery.py also passed. Anchored mutation/worktree/session regression suite:20passed,55assertions,0failed. Strict typecheck, native build and diff check passed. Full disk-full/crash-point and cross-host acceptance remain unverified.

### Exact saved-flow rerun through both public surfaces

Saved-file inspections record a contained source path and source/effective-flow digests, without copying input values into history. Terminal /app rerun and headless app rerun reopen by stable inspection ID and require current checkout, repository/settings/event fingerprints and full action review. A one-use exact grant executes through the existing leased inspection service with fresh browser state. Changed files, missing references and unsaved overrides require a new saved-flow run. Prior assertion provenance remains intact; fixture reset and current correctness are never inferred from history.

Actual compiled macOS arm64 rerun/report suite:7passed,54assertions,0failed. Native pty-inspection-rerun.py passed resumed no-replay, denied/no-request, one approved actual browser execution, draft preservation, resize and cleanup. Its first assertion incorrectly searched raw ANSI output for contiguous words; corrected to inspect ANSI-stripped output after confirming the rendered approval. TUI/CLI regression checks:4passed,1conditional packaged-only skip,44assertions. Strict typecheck and native build passed. Latest full suite:303passed,6conditional skips,0failed,2020assertions across58files (57.94s). Comparison/baseline review, live lifecycle controls and full App Inspection acceptance remain implementing.

### Recorded capture pair, overlay and diagnostic difference review

Terminal /app compare selects two stable canonical capture IDs; headless app compare accepts the same IDs and supports summary JSON or the owned local viewer. Manifest/hash/expiry checks precede decoding, with an8million-pixel bound per capture. Only recorded masked captures enter the comparison. Before/after and difference assets remain immutable; a script-free 50% overlay uses the existing constrained loopback server. Raw pixel measurement stays unknown for verification and comparability without reviewed baseline/fixture/font/settings evidence. Original captures and prior checks are unchanged.

Actual compiled macOS arm64 comparison/image/drawer suite:6passed,58assertions,0failed. A real layout change produced a positive difference; an actual inspection-service browser checked the heading, overlay toggle and hidden side-by-side image. Canonical-ID picker, draft preservation, read-only CLI summary and tamper refusal passed. Native pty-inspection-comparison.py passed two real captures, exact IDs, unknown truth, local viewer, no replay/inference, draft, resize and shutdown. Viewer URLs now occupy their own line at80columns after the PTY check exposed split raw terminal output. Strict typecheck, native build and diff check passed.

Configured baseline evaluation now records the browser engine/build, viewport, explicit flow fixture revision, observed font digest and deterministic screenshot-setting digest on each new capture. A versioned repository JSON policy binds its stable check ID, contained PNG path/hash, exact conditions, required flag and explicit thresholds. Headless `app baseline` previews the complete configuration/baseline/capture identity and requires the fresh review digest; terminal `/app baseline CAPTURE_ID CONFIG_PATH` uses the same service. The evaluation records a configured-repository `app_assertion` and never writes or adopts baseline bytes. Missing conditions remain unknown, mismatches remain non-comparable, a changed configuration or PNG invalidates review, and duplicate check identity for one inspection is refused. The focused real-browser baseline/comparison suite passed 5 tests / 53 assertions / 0 failed, including a passing identical capture, a failing layout regression, denial without an event, draft preservation, and byte-for-byte baseline preservation. Six consecutive controlled captures, including the baseline capture, produced one image digest and one capture-condition digest; a later deterministic layout shift failed at a zero changed-pixel threshold. The rebuilt macOS arm64 binary passed the same public baseline workflow. Latest full offline suite: 347 passed / 6 explicit conditional skips / 0 failed / 2322 assertions across 72 files; strict typecheck and native build passed. Full App Inspection acceptance remains implementing.

### Live App Inspection and manual takeover

The terminal now keeps one session-owned headed inspection open after exact review of its checkout, loopback origin and optional authentication reference. `/inspect-app URL [--auth ID]`, `/app capture`, `/app takeover`, `/app resume`, `/app save-login HOURS` and `/app stop` use the existing narrow Playwright service. Takeover blocks all Mavona capture/action/assertion operations; resume records a fresh bounded observation before returning control. Stopping during unreconciled takeover remains cancelled/unknown. Normal stop writes the immutable report and only then completes the browser effect. Attached servers remain user-owned.

Authentication state is stored with private permissions outside Git, session artifacts, events, reports and exports, expires within 24 hours, and requires a fresh exact same-origin reuse review. Loading now revalidates exclusion from the current artifact root as well as saving. The reviewed start path discovers `bin/rails`, binds its exact test-mode argv and port, captures bounded sanitized logs, waits for health, reports occupied ports without claiming an effect, and stops the process group on failure or `/app stop`. Attach health is explicit and attached processes are never killed.

Live terminal inspection now exposes `/app import PATH` and `/app annotate ARTIFACT_ID TEXT`. Import requires exact review of one contained regular PNG, including its source and normalized hashes, byte size and dimensions. Fresh validation refuses changed bytes, links, excluded paths and repository escapes. Imported evidence remains explicitly unreviewed with unknown runtime provenance; a bounded annotation has user provenance and stays attached to the original artifact in the immutable report. The public TUI/import policy tests passed 2 defining tests as part of their focused suites, including denial without an artifact event, final report association, drift and link refusal.

Actual focused browser/server tests: 28 passed / 138 assertions / 0 failed across live TUI, authentication, lifecycle, process ownership and advanced multi-engine behavior. Native compiled `python3 scripts/pty-inspection-live.py dist/mavona` passed reviewed attach and discovered start, masked capture, takeover, fresh resume, ownership-correct shutdown, draft retention, resize and terminal cleanup. Full offline suite: 344 passed / 6 explicit conditional skips / 0 failed / 2293 assertions across 71 files. Strict typecheck and native build passed. The public `/app revoke-login ID` command now deletes the protected authentication reference without starting a browser or placing cookie material in session evidence; its focused real-browser/TUI run passed 14 tests / 85 assertions / 0 failed. Crash recovery/reconciliation UX and the remaining 14-case release matrix still require acceptance.

Headless `app inspect` now performs the same explicit health attach by default and accepts `--start-server` only after its discovered test-mode Rails argv participates in the approval digest. Its structured result reports server ownership and sanitized owned logs. An unavailable attach returns `unknown` correctness with a failed non-effect instead of a pending effect or generic process error. Actual focused CLI/agent/rerun regression: 14 passed / 1 packaged-only skip / 103 assertions / 0 failed. The rebuilt macOS arm64 executable then passed all four inspection CLI cases / 29 assertions, including discovered server start and the browser-download worker with no source-runtime dependency. Cross-host packaged lifecycle execution remains required.

The repository-owned Rails browser launcher prepared its isolated SQLite fixture and owned server, then the canonical validation-failure, corrected-submit, Stimulus preview, Turbo confirmation, reload-persistence and independent database-outcome flow passed Chromium, Firefox and WebKit: 3 tests / 12 assertions / 0 failed. This is current-host engine evidence; other advertised hosts remain unverified.

Case 10 now has process-crash evidence in addition to cancellation evidence. A compiled `app run` process was killed immediately after one actual form POST and before effect completion. Canonical history retained one pending browser effect. `resume --format json` returned `mutationAllowed: false`, `effectReplay: never`, appended only `session.resumed`, and produced no second POST. Source and rebuilt macOS arm64 runs each passed 1 test / 12 assertions / 0 failed. Explicit reconciliation remains required before any new mutable run.

### Forked retained-source identity continuity

A regression demonstrated a restored deletion incorrectly projecting as retained after fork because copied envelopes receive new IDs. Fork now remaps the four explicit recovery/disposal recoveryId payload references along with causedBy. Historical review text remains unchanged provenance; source bytes and unknown effect state are never replayed. Actual restored and permanently removed source forks retain their tombstones under the copied completion ID. Source recovery/session lifecycle/headless suite:19passed,129assertions,0failed; strict typecheck passed. No cross-host claim or new acceptance completion is implied.

### Canonical session names, pins and confirmed archival

Session rename/pin events preserve stable identity and pending-effect truth. Titles are bounded and reject terminal/bidirectional controls; known secrets are redacted before persistence. Headless catalog rows include title, pin, recorded task context and locality, with pinned rows first within the bounded catalog. Terminal /session, /rename, /pin-session, /unpin-session, /archive and /unarchive provide the same metadata; archival confirms the exact session/event boundary. The picker searches names/task text as well as IDs/roots. Metadata changes never delete source, artifacts or drafts or establish fresh correctness.

Actual source and compiled macOS arm64 metadata/session suite:7passed,57assertions,0failed. Native pty-session-metadata.py passed rename, pin, denied/approved archive, searchable identity, unarchive/unpin, draft preservation, no inference, resize and cleanup. Native build and strict typecheck passed. Complete bounded-catalog scale/recency, new/fork/export/disk-usage controls and full session acceptance remain implementing.

### New/forked terminal sessions and writer transfer

Terminal /new creates a fresh session in the current checkout with the same explicitly configured connection and empty draft/history. /fork uses canonical history copying, preserving draft and unresolved effects. The destination writer is acquired before releasing the current writer through the existing native switch path. Failed switching preserves the current session and identifies the already-created destination. Headless sessions new --root PATH shares exclusive creation. Neither operation creates a worktree, replays an effect or bypasses pending worktree guards.

Actual compiled macOS arm64 creation/session CLI suite:8passed,52assertions,0failed. Native pty-session-create.py passed fork/new, independent original/fork/fresh drafts, stable-ID resume, writer transfer, zero inference, resize and terminal cleanup. Strict typecheck, native build and diff check passed. Worktree creation, historical artifact access across forks, export/disk-usage UX and full session acceptance remain implementing.

### Explicit committed source, selections and worktree return

Terminal /revision HEAD|FULL_COMMIT_ID [path] and headless source read bounded regular Git blobs, including files deleted from the worktree. HEAD resolves once; snapshots, selected context and diffs retain the exact commit identity. /worktree returns explicitly to current source. Historical views must return to the worktree before pinning/editing; attachments remain labelled reference evidence, never patch authorization. Git calls use argument arrays, literal paths, disabled hooks/fsmonitor/replacement objects and no text conversion. Binary, oversized, linked, excluded and invalid-revision reads refuse without changing the view or source.

A real missing-blob regression first observed one request to a local promisor stub. Historical reads now disable lazy fetch and remote protocols; the repeated test observed zero requests. The environment setting follows [Git's documented no-lazy-fetch behavior](https://git-scm.com/docs/git). Actual final compiled macOS arm64 source/history/diff suite:7passed,62assertions,0failed. Earlier source/controller/agent regression run:23passed,134assertions,0failed before the final missing-object test. Native pty-source-history.py passed real commit labels, exact historical attachment, explicit worktree return, draft retention, no inference, resize and cleanup. Strict typecheck, native build and diff check passed. Historical pinning, arbitrary prior-worktree snapshots and the full CODE interaction/acceptance matrix remain implementing.

### Measured read-only session storage status

Terminal /storage and headless sessions storage report sampled apparent-byte totals for session/data storage, separate metadata, screenshots, video and ZIP traces, default thresholds and explicit advisory global status. Existing per-run limits remain distinct from unimplemented global enforcement. The scan now counts every entry against its limit, checks directory containment/identity and refuses symlink roots; symlink entries are omitted and sampling is explicitly non-atomic. Checkout recovery source is outside this disposable-artifact scope.

The initial fixture exposed UUID-named trace misclassification. Final compiled macOS arm64 storage/retention suite:3passed,24assertions,0failed, including actual files, public terminal/CLI projections, unchanged canonical history and preserved retained source. Strict typecheck, native build and diff check passed. Global concurrent capture enforcement, configurable retention UX, exact file export and full retention acceptance remain implementing.

### Exact canonical session snapshot file export

Terminal /export and headless sessions export --destination preview the exact canonical-prefix snapshot hash, byte size, event count/hash, incomplete-tail count and destination. The deterministic file records snapshotAt; ordinary stdout export additionally records exportedAt. Artifact/authentication files are excluded. Session export and inspection archives now share anchored temporary-file, fsync, no-replace publication and final identity/hash verification. Destinations inside any sibling session or Git worktree are refused. Intent/result events are separate from application effects; interrupted output remains unknown and never replays or overwrites.

Actual compiled macOS arm64 session/inspection export and session CLI suite:9passed,81assertions,0failed. Tests cover denied/stale grants, concurrent destination creation, preserved pending effects/draft, auth-file exclusion, immutable canonical-prefix bytes and read-only previews. Native pty-session-export.py passed exact review, denial, approved JSON, draft, no inference, resize and cleanup. Native pty-inspection-export.py also passed after the shared publication change. Strict typecheck, native build and diff check passed. Full crash-point and cross-host export recovery remain implementing.

### Persistent high-contrast terminal themes

The terminal detects a light background from `COLORFGBG`, otherwise defaults to dark, and exposes `/theme dark|light|no-color` through direct input and the command palette. Theme changes use a versioned session event and replay on resume. `NO_COLOR` always selects the unstyled surface regardless of saved preference. Dark and light palettes set explicit foreground, background, border, focus, cursor, selection and Ruby syntax colors; focused input retains a border shape and every status remains textual. Changing theme remounts only the source renderer so an open source view cannot retain its prior palette.

Focused controller/OpenTUI/source checks:12passed,55assertions,0failed. Captured native renderer spans confirmed dark `#f2f5f8` and light `#18202b` heading colors while draft and textual status survived the change. Rebuilt macOS arm64 `python3 scripts/pty-theme.py dist/mavona` passed light-background detection, dark/light/no-color event persistence, zero inference,80×24→60×18 resize and original terminal-mode restoration. Strict typecheck and native build passed. Markdown/tool presentation and all-host terminal acceptance remain implementing.

### Unicode composition and explicit RTL boundary

The composer preserves an atomic UTF-8 composition commit containing CJK, a multi-code-point emoji and a decomposed combining sequence in its canonical draft. Standalone right-to-left input remains in logical storage order. The TUI specification now records the measured v0.1 limitation: OpenTUI and the terminal control shaping and bidirectional cursor movement, and mixing RTL text next to combining marks can reorder the mark in the editor's backing text. Users can place the RTL text on a separate line or compose it externally and paste atomically.

The real OpenTUI renderer check passed9tests/42assertions, including exact model storage, visible CJK/emoji/RTL and60×18 resize. Rebuilt macOS arm64 `python3 scripts/pty-unicode.py dist/mavona` passed actual PTY UTF-8 composition bytes, exact persisted draft values, standalone RTL logical order, zero inference, resize and terminal cleanup. Cross-host IME implementations and mixed-direction cursor behavior remain unverified or unsupported as documented.

### Streaming Markdown and canonical tool cards

Canonical user/assistant deltas, tool calls and verification results now project into stable transcript items. Adjacent assistant deltas coalesce and render through OpenTUI's incremental Markdown renderer with concealed syntax and conservative terminal tables. Tool cards show textual state, tool, bounded target, measured event duration and stable call ID. `/tool CALL_ID`, also available in the command palette, expands sanitized arguments and bounded result text. Oversized terminal details carry an explicit truncation marker while canonical bounded events remain unchanged. Verification uses a separate double-border card and always includes state and provenance.

Focused projection/controller/OpenTUI checks:13passed,61assertions,0failed. They cover resumed projection, Markdown concealment, stable tool IDs, expanded arguments/results, terminal-only truncation, unknown verification styling, draft preservation and no event mutation from expansion. Rebuilt macOS arm64 `python3 scripts/pty-transcript.py dist/mavona` passed a resumed canonical Markdown/tool/verification history, palette-driven expansion, preserved draft,80×24→60×18 resize and terminal cleanup. The complete offline suite passed334tests/2237assertions with6conditional skips and no failures across67files. Full code-block copy/save actions, rapid-stream latency measurement and all-host PTY evidence remain implementing.

### Configurable opt-in retention policy

Each session now has a versioned retention policy covering warning and hard byte thresholds, archive age, artifact-expiry age and the explicit artifact-expiry opt-in. Validation keeps warning at or below the hard limit, bounds age settings and requires expiry age to follow archive age. Terminal `/retention` and headless `sessions retention ID` expose the same policy; all fields change together so a partial command cannot silently retain stale values. Configuration removes nothing. The expiry primitive now requires both the persisted opt-in and the exact expiry action opt-in, uses the configured age, refuses pinned sessions and preserves its existing ID/hash/provenance tombstone. Retained checkout source stays outside the policy.

Retention/session/controller checks passed9tests/63assertions; rebuilt compiled checks passed6tests/40assertions with no failures. Native macOS arm64 `python3 scripts/pty-retention.py dist/mavona` passed palette configuration, exact replayable policy, draft and retained-source preservation, zero expiry/inference,80×24→60×18 resize and terminal cleanup. The complete offline suite passed337tests/2253assertions with6conditional skips and no failures across68files. Global concurrent capture enforcement, reviewed public artifact-expiry selection and remaining process-crash behavior remain implementing.

### Injected disk-full export recovery

The shared anchored export publisher now accepts an internal write boundary used to inject a real partial write followed by an `ENOSPC` failure. The destination stays absent, the private temporary path remains available for inspection, and the canonical export completion is `unknown`. The session remains writable and reopens with the original request/result history; no automatic retry, overwrite or success is inferred. Retained checkout source bytes remain unchanged. This same publisher serves session JSON and inspection tar exports.

Session/export/crash regression checks passed18tests/105assertions with no failures, including partial canonical-event-tail truncation, complete-record corruption refusal, killed-writer ownership recovery, unknown effect replay, competing destination creation and the injected disk-full boundary. Strict typecheck passed. Additional process-kill points around artifact capture and final directory fsync, plus global capture reservation, remain implementing.
