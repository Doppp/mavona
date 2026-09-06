# Mavona v0.1 implementation plan

## Baseline and documentation disposition

Implementation branch: `codex/mavona-v0.1`, based on `master` at `fdee113` (Ruby 0.2.0.alpha.1). Remote: `git@github.com:Doppp/mavona.git`. The initial checkout already deleted the Ruby source, tests, gem/build files and old documents, and introduced the specification pack. Those deletions are pre-existing user changes: leave them unstaged until replacement/parity acceptance permits retirement. A private input snapshot and initial binary diff are at `/tmp/mavona-input-20260906`; Git preserves the committed Ruby baseline. Do not reset or restore the user's checkout.

Keep root README, concise AGENTS and the existing standard MIT LICENSE (2026 Daryl Yeo). Keep distinct normative contracts in `docs/specs/` because their responsibilities differ; do not concatenate overlapping authority. Keep this executable plan and the release contract/ledger in `docs/`, settled decisions in `docs/adr/`. Consolidate kickoff workflow and review corrections into AGENTS, this plan and affected contracts. Exclude prompts, review correspondence, historical source audit, HTML mockups, captures and scratch reports. Extract mockup requirements into TUI and App Inspection contracts; retain input privately, not as duplicate tracked design assets. Remove contradictory active Ruby guidance as replacement documentation is committed. No input ZIP is tracked.

## Actual inventory and reuse

The historical Ruby code implements static/optional boot discovery, proportional task analysis/context, provider contracts, local loopback controls, a line-oriented TUI, whole-file tools, verification, loose JSON task storage and a nine-task evaluation harness. It has no OpenTUI, source viewer or full browser inspection. Historical tests contain useful local repositories, provider TCP stubs, dirty-tree checks and evaluation process/result semantics. Preserve these behaviors through independently characterized fixtures, not a mechanical class translation. Existing CI runs Ruby tests; switch to Bun checks when their paths exist, while keeping baseline evidence independent. No unrelated functionality is removed merely to simplify porting.

The bounded baseline restoration uses an archive of `master` outside this checkout, two environment attempts, no production logic edits and no paid calls. Record observed failures; do not turn a broken oracle into a pass. Full parity needs at least 50 distinct task/fixture pairs, a versioned normalizer and reviewed divergence/fallback manifest before RAILS acceptance and retirement. Nine smoke grader semantics remain separately required.

## Interfaces and state ownership

Use the architecture's `apps/mavona`, `packages/{protocol,domain,agent,rails,providers,tools,verification,app-inspection,sessions,tui,cli,testing}`, `probes` and `fixtures` boundaries. Create packages only when a slice uses them. Public seams:

- `inspectRepository(path, options)` returns bounded static facts, candidates, unknowns and provenance without executing repository code.
- A repository read service returns contained, bounded, digest-labelled source snapshots; selections do not call providers.
- A single application dispatcher validates commands, durably records intents, runs authorized effects and records results. Domain reducers own truth; TUI/CLI only project it.
- Providers expose normalized streaming events, capability evidence and cancellation; adapters never execute tools.
- Policy authorizes validated effects bound to checkout, settings, script/flow and revocable scope. Configuration is never permission.
- Verification reduces independently executed, freshness/provenance-bearing checks into passed/failed/unknown. Empty checks remain unknown.
- Inspection exposes only start/observe/act/capture/assert/stop over Playwright, with isolated context and explicit effect/egress policy.

Protocol v1 envelopes carry stable IDs, sequence, session/task, timestamp, payload schema version and causal request ID. JSONL is canonical; SQLite is rebuildable. The writer serializes append/fsync before effect execution. Replay performs no effects; incomplete trailing bytes alone may be removed. Unknown incompatible envelopes or safety-bearing payloads prevent mutation. Duplicate IDs cannot apply twice. Compaction retains canonical constraints and evidence; old Ruby JSON import/export requires explicit conversion, not assumed schema equivalence.

## Ordered slices and commit boundaries

| Milestone | End-to-end slices | Acceptance IDs | Verification/removal boundary |
| --- | --- | --- | --- |
| 0 | Inspect baseline, organize docs; pin Bun/TS/OpenTUI; packaged static inspection; renderer/SQLite/probe/browser-driver spikes | RAILS-01, CLI-01, DIST-01 foundations | Native macOS arm64 now; other hosts remain unverified. No Ruby retirement from spikes alone. |
| 1 | Render immediate real shell, multiline composer, streamed test transcript, durable events, approval/diff/evidence cards | UI-01–03, SESSION-01, CLI-01 | Domain events match headless; PTY input/paste/resize/cleanup. Fake route explicitly test-only. |
| 2 | Git/Rails discovery, measured no-boot parser, scoped instructions/cache, task surfaces/routing/context, smoke runner parity | RAILS-01–03 | Namespaces, multi-root, ignored/symlink files, boot failure, 50-pair parity plus nine-task result semantics. |
| 3 | Native Responses/Messages, compatible presets, local discovery, credentials/preflight/model switching, official subscription assessment | MODEL-01–04 | Local stub streaming/cancel/error/image contracts for every preset; live rows separate and spending-gated. |
| 4 | Real read/search/list/patch/probe/command loop, policy/revocation/locks, diff tracking and independent verification | AGENT-01, POLICY-01, VERIFY-01 | Hostile config, changed script/settings, stale patch, dirty worktree, bounded cancellation/repair, real Rails checks. |
| 5 | Recovery/SQLite/compaction/retention; full source viewer/editor, pickers/themes, long-session responsiveness | SESSION-01, CODE-01–02, UI-01–03 | Crash transitions, unknown versions, source drift, external editor PTY/GUI lifecycle, 50k lines and Unicode. |
| 6 | Full Playwright start/attach, observations/interactions/takeover; comparisons/profiles/flows; sanitized report/trace/video/images | APP-01–04 | All 14 inspection cases, actual Rails/Turbo/Stimulus persistence assertions, three engines, TUI and headless. |
| 7 | Canonical scenarios A–F, packaged native matrix, installer/Homebrew inputs/checksums/provenance/SBOM and truthful docs | All, DIST-01 | Actual cloud/local demonstrations and native hosts required; prepare signing artifacts, do not publish. |

Each coherent tested slice gets a targeted staged review, ledger reconciliation and descriptive local commit. Reports at milestone boundaries are non-blocking: continue immediately through Milestones 0–7. Do not make empty milestone commits. Replace obsolete entry points/dependencies/CI only as functional replacements are verified; do not stage inherited deletion wholesale. Full acceptance, not a preview or pilot, ends implementation.

## Dependency and packaging checks

Registry inspection on 2026-09-06 identifies Bun 1.4.2 (MIT), TypeScript 7.0.2 (Apache-2.0), OpenTUI Core/Solid 0.5.10 (MIT), with exact Solid peer 1.9.12 and Core web-tree-sitter peer 0.25.10. Pin each independently and commit the lock. Use native TypeScript 7 typechecking and the maintained Babel Solid transform; no compiler-API consumer is planned. Validate the installed transitive build path before declaring compatibility. Bun was absent from PATH; bootstrap the pinned development runtime outside the repo, not a product dependency fallback.

Bun SQLite is the first packaging candidate (no extra native package). OpenTUI embeds native renderer/parser assets according to its current standalone docs; prove compiled loading. Playwright driver packaging, isolated trace sanitization and browser binaries need separate runnable spikes before support claims. No silent browser/model download. Parser choice needs measured Prism versus current extraction on representative fixtures; no speculative dual analyzer.

## Checks, risks and effort

Default tests use isolated local fixtures, fake providers/clocks, stub HTTP servers and no paid inference. Match checks to affected behavior, then advance. Public TUI/headless behaviors need both projections. Native binaries must run without user Node/Bun/npm. Required command, environment, exit and evidence fields live in the acceptance ledger.

Largest uncertainties: OpenTUI terminal/IME behavior and embedded assets; safe browser trace/video sanitization; target-native host availability; parser availability in older/container Ruby; historical parity defects; live model credentials/spend; signing/notarization. No spending allowance has been supplied, so paid checks are blocked while implementation continues. Other platform hosts and signing access are unconfirmed. Do not convert cross-compilation to native evidence.

Effort ranges are currently unknown rather than invented. Measure elapsed implementation and failure/recovery cost for the first inspection/renderer/persistence/browser slices; use that evidence for remaining estimates, separating engineering effort from waiting for external hosts/access. The baseline restoration ceiling is two environment attempts. Benchmarks are optional separately budgeted learning and never gate product implementation.

## Continuation checkpoint

Local commits completed: documentation disposition, offline inspection/source primitives, event/SQLite/renderer foundations, and deterministic routing/compatible transport. Current executable: `dist/mavona`, a development inspection UI and CLI only. Build artifacts are ignored. Native macOS arm64 startup/input/paste/resize/cleanup passed; no other target support is established. Current default suite: 31 passing tests, one packaged-only skip; that test passes in the separate four-test packaged suite. Ruby baseline: 90 tests / 526 assertions passing. No milestone or full capability is acceptance-passed.

Immediate executable continuation:

1. Read the ledger's M0/M1/M2/M3 evidence and current narrow interfaces; run only checks affected by new work. Bun development PATH is `/tmp/mavona-toolchain/node_modules/.bin`; installation may need recreation if temporary storage expires.
2. Finish M0 probes: measured no-boot Prism on fixtures, SQLite packaged reopen, Playwright driver/browser provisioning from the compiled binary, and renderer exception/signal coverage. No browser/model install is implicit in launching Mavona. Record actual native environments.
3. Expand the application dispatcher to own persisted drafts, transcript, provider selection and complete request/effect lifecycle. TUI currently retains draft only in memory until submission and starts a new session each launch; session replay primitives are not full resume. Stale writer-lock reconciliation, compaction and retention remain unimplemented.
4. Complete M1 streaming transcript, approval/diff/evidence/plan interactions using test-only deterministic providers, then wire actual configured adapters under capability and spending/permission checks. CompatibleProvider is only a transport primitive: native OpenAI/Anthropic, presets, model discovery, capability preflight, tool-call assembly, structured errors, image serialization and secure-store platforms are still missing.
5. Build policy-bound patch/command/probe tools and the real provider-neutral loop. No current command may claim it changes or verifies Rails code. Required verification must retain independently defined acceptance provenance. Add a real Rails/Turbo/Stimulus fixture and canonical scenarios rather than treating this repository as Rails evidence.
6. Complete static instruction scope, measured parser/cache/context widening and the 50-pair parity/divergence manifest plus nine-task smoke semantics. Routing tests document a correction but do not fulfill parity review.
7. Finish source search/highlighting/picker/selection attachment/diff/history/editor handoff, all App Inspection flows and 14 cases, session UX/performance and distribution matrix. The basic `/open` screen is not CODE-01/02 acceptance.
8. Continue regular targeted commits and non-blocking milestone reports. Paid demonstration has no budget; other native hosts/signing are unconfirmed. These external rows cannot pass and do not block independent feature work.

Initial Ruby code/test/build deletions remain pre-existing and unstaged, pending functional replacement and mechanical parity retirement. Superseded documentation deletions are incorporated into maintained-doc cleanup. Do not accidentally stage all remaining deletions, reset them or represent them as tested retirement. Remote CI is prepared, not executed; nothing has been pushed, merged or published.
