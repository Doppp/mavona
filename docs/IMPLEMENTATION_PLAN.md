# Mavona v0.1 implementation plan

## Baseline and documentation disposition

Implementation branch: `codex/mavona-v0.1`, based on `master` at `fdee113` (Ruby 0.2.0.alpha.1). Remote: `git@github.com:Doppp/mavona.git`. The initial checkout already deleted the Ruby source, tests, gem/build files and old documents, and introduced the specification pack. A private input snapshot and initial binary diff are at `/tmp/mavona-input-20260906`; Git preserves the committed Ruby baseline. After current-host v0.1 implementation and acceptance, the user explicitly chose the TypeScript/Bun implementation as a clean replacement and authorized committing this inherited deletion set and force-publishing the replacement history. External release gates remain recorded separately and are not implied to have passed.

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

## Active integration plan — 2026-09-07

The provider adapters, CLI/TUI task loop, three-engine inspection flow runner, Rails probe/fixture, source references/diffs/editor, anchored create/delete/patch operations and repository fingerprints are integrated. Session files now have bounded reads, link refusal and active-log drift checks. Worktree effect records survive process death across sessions; explicit CLI/TUI reconciliation preserves unknown outcomes and invalidates verification. These are tested implementation slices; no full milestone or capability is acceptance-passed.

Continue in these concrete slices:

1. Complete remaining clipboard/selection and historical-source interactions, themes and remaining picker/lifecycle actions. Connection/model/command/session pickers now have local native evidence. Highlighting, fuzzy files/root navigation, pins and responsive layout now have local native evidence. Preserve native editor and multiline input behavior with PTY tests.
2. The frozen 50-pair routing/verifier projection, byte-preserved task/grader fixtures, native Darwin isolation and local result-semantic checks are implemented. Broader external runtime/host evidence remains a release gate. The user explicitly authorized clean replacement of the old Ruby implementation after the current-host v0.1 checkpoint.
3. Complete remaining verifier-scope breadth and context/decision continuity. Structural no-boot/runtime probes, instruction widening, bounded repair and deterministic context compaction are integrated into the task loop. Verify long-session replay/rendering and complete recovery crash transitions.
4. Complete remaining comparison/report interactions, agent image use and all 14 acceptance scenarios through the shared service. Sanitized traces/checkpoint videos, offline replay and responsive profiles have native local evidence. Browser engines remain explicit installs.
5. Run canonical real Rails scenarios and target-native packaging checks; prepare installer/Homebrew, checksums, provenance/SBOM and signing inputs without publishing. Continue through every milestone without routine reauthorization.

Development Bun is `/tmp/mavona-toolchain/node_modules/.bin/bun` (1.4.2); Ruby is `/Users/daryl/.local/share/mise/installs/ruby/4.0.6/bin/ruby`. Temporary development installations are not product runtime fallbacks. The real Rails fixture owns only isolated test SQLite files. Browser engines were installed explicitly for local testing. Paid inference has no budget; other native hosts and signing access remain unconfirmed. These rows stay unknown/blocked while independent implementation continues. No push, merge or publication is authorized.

### Protected smoke runner implementation slice

Preserve all nine task definitions, grader/support bytes and repository pins under evaluation/smoke as executable benchmark fixtures. Keep the runner in packages/testing/evaluation and a development script outside the evaluated agent. Its bounded interfaces are catalog validation, clean pinned checkout preparation, an OS-enforced agent filesystem boundary, post-exit copied grading state, structured grading normalization and paired reporting. Do not pass hidden grader paths or assertions to the agent; do not equate an outside-worktree path with filesystem isolation. On Darwin prove sandbox-exec denial with a hostile local subprocess; on Linux require a functioning restricted namespace backend and otherwise return unavailable. Grade a separate fresh directory so a surviving child cannot read a subsequently installed grader through its old worktree grant. Preserve failed/not_run/error distinctions; no unrun or malformed grader output can become passed. No paid evaluation runs are authorized. Add failing isolation/result fixtures before integrating the runner, and keep target-native support claims limited to executed evidence.

### Constrained browser trace and video slice

Use the pinned in-process Playwright recorder and viewer format. Before recording, validate the 1.63.0 recorder boundary and intercept its persistence sinks with an allowlist: method identities/timing/outcome, safe context dimensions and explicitly masked image frames. Exclude arguments/results, DOM/source snapshots, console objects, raw network bodies/headers and client source stacks before any trace write; fail closed when the pinned hook shape is unavailable. Export a genuine Playwright trace archive and validate it with the upstream offline loader. Flow evidence options participate in the exact approval digest. Add opt-in sampled video encoded only from masked frames through the managed Playwright FFmpeg binary; never enable raw browser video as a substitute for pixel sanitization. Expose artifacts and truthful recording status through the shared service and CLI/TUI report. Keep trace/image/video success separate from functional verification. Start with actual sensitive-field/cookie/query canaries and interrupted-flow fixtures, then verify native packaged recording and offline replay.

### Packaged offline trace viewer slice

Embed the exact pinned upstream Trace Viewer static assets using Bun's file loader. Serve only those assets and a bounded validated constrained trace snapshot from a short-lived loopback server with an unpredictable path, strict host/origin checks and restrictive CSP. Never expose arbitrary filesystem routes or forward requests. Add `app replay --trace-file PATH`, keep lifecycle owned by the foreground command, and verify actual upstream UI action loading through an isolated inspection-service browser context with an enforcing local-only proxy. Application inspection contexts continue blocking service workers; only this trusted embedded viewer uses them. Test path/host refusal and shutdown, then run the compiled binary without repository/Node/Bun runtime dependencies.

### Responsive profile evidence slice

Add named desktop/tablet/mobile configurations with explicit viewport, pixel ratio, touch and mobile layout settings. Bind profile/scheme/motion choices to the reviewed flow; reject conflicting viewport overrides rather than mislabel a profile. Record the requested profile and actual availability per run and on captures, with other profiles explicitly unchecked. Reuse the same CLI/TUI flow service. Verify real browser-visible viewport/touch/media settings across all three engines; unsupported options must preserve unknown assertions and report their engine exception. Check actual touch events rather than infer support from maxTouchPoints, which differs between the pinned engines. Expose no claim of real-device testing.

### Bounded structured page evidence slice

Extend observe with an optional semantic locator and a bounded rendered DOM projection: element tag, explicit/HTML role hints, selected safe attributes, visible text, geometry and disabled state. Never copy form values, script/style source, handlers, private selector subtrees or hidden ancestor contents. Use observation-owned UUIDs and parent references, label the projection as untrusted DOM/ARIA hints rather than a complete accessibility audit, and explicitly mark truncation. Keep selected observation data in the shared report for headless/TUI review. Start with real hidden/private/password/attribute canaries and a large DOM fixture; require unique locator selection before scoped observation.

### Coding-loop App Inspection integration slice

Expose one bounded `inspect_app` tool that proposes a declarative flow to the existing inspection service. Normalize all model assertions to model-proposed before review; browser effect approval never adopts acceptance criteria. Require a fresh exact flow/configuration/repository review, reuse the task's verified worktree lease and pending-effect guard, and refuse absent/changed authority before launch. The terminal reviews the concrete flow; headless use can explicitly allow a saved flow once. Persist sanitized app_observation/app_assertion evidence and artifact links as versioned events, never raw browser argument values or URL queries. Return a bounded diagnostic summary and retain the full local report. Keep independent repository verification and task budgets in charge of completion. Add an actual fake-provider→source patch→real browser→independent verifier path plus denied approval, changed review, failed-effect and forged-provenance cases; no paid model is required.

### Explicit terminal connections and model selection slice

Add validated custom endpoint/locality selection to the existing terminal connection command, preserve explicit non-secret selection across session replay, and expose bounded model discovery in the existing searchable picker. Selecting or switching a model must make no inference request, retain draft/references, and revoke stale execution grants. Discovery sends no repository context and retains an explicit model when unavailable. Test an owned local HTTP provider through the actual TUI controller, capability preflight, browser proposal/approval and canonical evidence; do not patch global provider presets. Keep credential values outside composer/config/events and display only credential source and locality.

### One objective repair attempt within the task budget

After a required, fresh, non-model-proposed verifier exits nonzero, permit at most one configured repair pass. Reuse the same task, worktree lease, model/locality, grants, acceptance baseline, turn/tool/time budget and canonical history. Send bounded actual failure evidence back to the model; invalidate prior verification before repair and rerun independent checks afterward. Unknown/cancelled/stale outcomes, missing checks and browser-model diagnostics cannot trigger repair. Expose the attempt in shared events/TUI and allow CLI repair-attempts0|1. Prove actual failing source is repaired, permanent failure stops after one attempt, disabled/exhausted budgets make no extra inference, and acceptance tampering still requires explicit adoption.

### Deterministic context compaction and ranged evidence retrieval

Replace context-limit-only stopping with a bounded local compiler that preserves the task, system/repository instructions, explicit selected context, acceptance/check state and canonical outcome references. Compact older assistant/tool exchanges only as complete protocol groups; retain a recent complete exchange when it fits, otherwise refer to persisted outcomes. Record versioned compaction metadata and input hashes without persisting raw browser argument values. Add ranged read_file and bounded current-task read_tool_result retrieval so large source/output does not force repeated oversized context. Keep full file digests for patch authority, report omitted ranges explicitly, retain canonical history unchanged, and stop honestly if pinned constraints alone exceed the budget. Test real large-file reads/patches across compaction, tool-pair validity, retained constraints/outcomes, duplicate tool IDs, privacy and CLI/TUI context notices.

### Agent no-boot structural evidence and instruction widening

Expose the existing versioned Prism parse operation through one bounded parse_ruby tool. Keep its Ruby executable and parser policy harness-owned; accept only explicit contained Ruby paths, never model-provided argv or runtime boot. Preserve declared-versus-runtime provenance, failed/unknown results, full file digests and canonical output retrieval. When reads or parsing widen to a new path, load its applicable instruction ancestry into pinned context so compaction cannot erase newly discovered constraints. Prove a real provider turn receives actual parsed association/method declarations without executing hostile top-level Ruby, and retains newly encountered instructions after widening.

### Command palette and argument entry

Use a stable local command catalog for a searchable Ctrl+P palette and generated help. Choosing a command with required arguments opens a bounded argument field in the existing picker; commands use the existing controller paths and approval rules. Keep the composer draft intact through filtering, cancellation and execution. File search remains /files. Add Ctrl+D for the existing revision-labelled diff and Ctrl+R for Rails evidence. Verify controller actions and native keyboard interaction at80×24, including cancel, resize and terminal cleanup; palette navigation must make no inference request.

### Terminal session picker and atomic resume

Expose local session summaries in a bounded, searchable Ctrl+O picker, including stable session ID, archive state and pending-effect count. Resume only when the current controller is idle. Acquire and validate the destination session before releasing the current writer; preserve its persisted draft and stop owned view resources during switching. Rebuild a controller from canonical events, invalidate resumed verification using existing lifecycle rules and never replay effects. Keep corrupt/unsupported histories unavailable for mutation. Test cancelled selection, failed ownership acquisition, actual native switching, pending-effect truth and terminal cleanup.

### Explicit runtime Rails probe

Add a separate small, versioned Rails-runner probe for resolved route metadata, selected Active Record model associations/columns and in-checkout loader paths. The coding loop may propose it, but the existing exact command approval and durable worktree effect guard must authorize boot first. Use the selected Rails root, explicit test environment, a private copied script, bounded model names/output/time and the existing clean environment/process-group cancellation. Disclose that initializers execute application code and may have effects; runtime observations are not functional verification. Preserve unknown on missing boot, malformed output or interrupted effects. Test denied boot without launching the app and actual approved Rails fixture introspection.

### Local native distribution preparation

Package the current native executable with exact checksums, source/build provenance, an SPDX2.3 dependency inventory, notices, local install/remove scripts and a Homebrew formula template. Derive host/architecture and dirty-state evidence without claiming other-host verification, signatures or release readiness. Inventory installed package metadata without executing dependencies; label unobserved bundled internals explicitly. The installer accepts an already-unpacked local artifact, verifies host and binary digest, refuses existing destinations and installs atomically. Removal checks the recorded digest and preserves modified files and session/browser data. Test clean-prefix native startup, corruption, existing-file preservation and removal. Prepare publishing/signing inputs only; do not publish or sign without credentials/authorization.

### Explicit current-task image submission

Keep a bounded in-memory catalog of masked captures produced by the current coding task's inspection service. A model may propose stable capture IDs through select_inspection_images; only an exact user review of IDs, digests, dimensions and the unchanged provider/model/endpoint/locality permits image blocks into subsequent requests. Refuse imports, persisted report claims, unknown IDs, duplicates, changed bytes and unsupported vision. Revalidate bytes before submission and retain canonical metadata without base64. Terminal /vision on is an explicit capability override for the current selection, cleared on switching; it never grants image submission. Verify actual masked browser capture through an owned HTTP provider and denial/byte drift with no image request. Images and model judgements cannot establish verification.

### Headless exact image grants

Add --allow-image-sha256 JSON_ARRAY as a bounded explicit vision override and one-use grant for exact masked PNG bytes on the command's selected provider/model/endpoint/locality. Validate before inference. Browser-flow authority remains separate; no images are sent unless the coding tool selects a current-task capture whose digest matches an unused grant and settings remain unchanged. Unknown/mismatched digests produce denied selection while DOM work can continue. Prove native CLI execution with actual fresh browser captures, changed/missing grants and two distinct captures of identical bytes consuming only one grant.

### Inspection evidence identity and repository provenance

Sample bounded repository commit/dirty fingerprints at observation and capture checkpoints through a harness-owned callback; page content and imported images cannot supply provenance. Record explicit unknown session/task/runtime fields where unavailable, sanitized page/frame/title, actual browser/profile/OS, and sample time rather than imply an atomic application/database snapshot. Persist capture metadata as a versioned inspection.artifact event immediately after the masked file is written, so a later interruption retains its identity without reopening the browser. Keep reports backward-readable with optional additive metadata. Verify a real browser flow spanning a repository change, stable session/task associations, sanitized metadata and canonical capture replay without effects.

### Bounded sanitized request timing evidence

Record a separate bounded request ledger from Playwright lifecycle events: stable request/page/frame/step IDs, sanitized URL, method/resource type, HTTP status, terminal outcome and available timing fields. Do not read headers, cookies or bodies. Preserve null for unavailable timing and unknown for interrupted requests; HTTP500 is an HTTP response, not a transport failure. Keep truncation explicit and independent of the diagnostic-error budget. Include bounded metadata in the local report and coding-loop summary. Test actual delayed responses, HTTP errors and blocked failures across all installed engines, plus deterministic count/unknown-value boundaries.

### Terminal inspection evidence drawer

Add /app and /app history to review bounded canonical inspection summaries, assertions, observations and capture references by stable inspection ID. Persist a sanitized summary at completion for both TUI/headless runs. The drawer explicitly represents recorded evidence, not browser liveness or current verification; expired captures are labelled and unavailable details stay unknown. Retain composer/source state, support keyboard scrolling/Escape and command-palette history selection at80×24 without images. No navigation, inference or effects occur while viewing history. Verify a real flow's controller projection, malformed/expired historical evidence and native PTY resize/focus/draft cleanup.

### Immutable local inspection report viewer

Record a versioned manifest of exact report HTML and managed masked captures/constrained trace/video/sanitized downloads when a run completes. The report viewer loads only manifest-listed files within session storage, checking containment, file identity, size and hashes before serving an immutable bounded snapshot. Bind an unpredictable loopback URL to exact Host/Origin and GET/HEAD, with no scripts, arbitrary file route or outbound access. Exclude report JSON/authentication state from this viewer bundle. Add read-only headless app report --session ID --inspection ID and terminal /app report for the selected run; own shutdown with Ctrl+C or /app stop. Verify actual browser display, full-resolution image bytes, tamper/link/path refusal, request policy and native shutdown.

### Explicit portable inspection export

Preview an exact manifest, file hashes/sizes and a new absolute .tar.gz destination before export. Export only the immutable viewer bundle plus a portable manifest, excluding report JSON/authentication state. Keep this artifact-copy operation outside Git worktrees and session storage so it cannot mutate application code or contend with a coding task. Revalidate source bytes, destination absence and parent identity after approval. Encode with Bun's bundled archive API, write a private temporary sibling through the existing anchored filesystem boundary and publish without replacing an existing destination. Persist export intent/result separately from application effects; interrupted output is unknown and never replayed. Verify archive contents, denied/stale grants, existing-file preservation and native packaging/runtime behavior.

### Reviewed source restoration

Project retained deletions from canonical tool request/result pairs using the completion event ID, never filename or hash as identity. Preview owning checkout, original path, retained path/hash/size/mode, current repository/settings fingerprints and directory/file identities. Restore only a known successful retained deletion after exact fresh approval, using the owning worktree lease, durable patch effect guard and anchored no-replace move. Preserve current files, executable mode and ambiguous outcomes; invalidate prior verification after restoration. Expose session CLI and terminal recovery selection without inference or automatic replay. Test a real agent deletion/restoration, missing/stale/occupied paths and native operation; permanent disposal remains a separately reviewed action.

### Reviewed permanent retained-source removal

Offer a separate user-only disposal command with exact retained ID/hash/mode, owning checkout, current event/settings/repository fingerprints and an explicit irreversible scope preview. Leave any recreated original source untouched. Persist the private random staging path before an anchored no-replace move, validate staged identity/bytes before unlink and fsync the parent. Record success as a tombstone; interruptions remain unknown with both paths recorded, block mutations and require reconciliation. Never automatically purge source on archival or expiry. Test real deletion/disposal, stale/denied review, replacement refusal, current-source preservation and both public surfaces; verify the native filesystem primitive in the packaged binary.

### Explicit saved-flow rerun

Record a contained repository flow path plus source/effective-flow digests for saved-file inspections, without copying arbitrary input values into session history. Missing, external or overridden source references remain unavailable for exact rerun. Reopen by stable inspection ID, reread the bounded contained source and require unchanged source/flow digests. Review current checkout/settings/repository/event fingerprints and full browser actions before a one-use rerun. Own the worktree and revalidate after lease acquisition, then execute the existing inspection service with fresh browser state and preserve independent required assertion provenance. Never infer a reset fixture or fresh correctness from the previous run. Expose headless app rerun and selected terminal /app rerun, retain drafts, and test actual browser requests, denied/stale review, changed saved files and native operation.

### Recorded capture pair review

Select two canonical capture IDs, load only their immutable manifest-checked masked PNGs and refuse changed, expired, duplicate or unreviewed evidence. Provide a local before/after, 50% overlay and raw pixel-difference viewer with exact IDs/hashes and bounded image decoding. Raw difference is diagnostic: missing fixture/font/capture-condition evidence or reviewed baseline keeps comparability and verification unknown. Reuse the script-free loopback report server with explicit in-memory assets; no browser navigation, inference, original-image mutation or baseline adoption occurs while reviewing. Expose terminal /app compare and headless app compare; test actual captures, image bytes/viewer behavior, unknown truth and native lifecycle. Reviewed baseline configuration and measured repeatability remain a following integration slice.

### Forked recovery identity continuity

Session forks assign new envelope IDs. Remap the explicit retained-source recoveryId references alongside causedBy so completed restoration/disposal tombstones continue to refer to the copied deletion event. Preserve historical review text as original evidence and retain all unknown effect states; do not replay or copy source bytes. Test an actual restored/deleted-source fork before extending session controls.

### Session names, pins and reviewed archival

Add canonical rename/pin metadata with bounded control-free titles, expose it in the headless catalog and terminal session picker, and search recorded task text as well as identity/root. Preserve stable session IDs independently of titles. Add terminal current-session status, rename, pin/unpin and archive/unarchive commands; archival reviews the exact session/event boundary, never deletes source or evidence and preserves the draft. CLI named operations share metadata validation. Verify replay, title refusal/redaction, catalog/search, denied/approved archival and compiled terminal behavior. New/fork/export/disk-usage controls remain following session slices.

### Terminal new and forked sessions

Create a fresh session with the same explicitly selected connection but an empty draft/history, preserving the source session on disk. Fork through the existing canonical history copier, retain draft and unresolved effects, then acquire the destination before releasing the current writer. Expose /new and /fork without model calls or worktree mutations; these commands use the same checkout and say so in help. Keep created destinations available if switching fails and preserve the current session. Add headless sessions new --root PATH, validate exclusive creation and test both public surfaces plus real native switching/terminal cleanup. A separate checkout/worktree workflow is not implied by session creation.

### Explicit committed source viewing

Read HEAD or an explicit full commit ID through bounded argument-array Git object commands, with hooks/fsmonitor/replacement objects disabled and no filters/textconv/network. Resolve HEAD once and label the immutable commit in every snapshot, selection and diff; refuse excluded paths, symlink/submodule modes, binary/oversized blobs and invalid revisions. Add /revision HEAD|COMMIT for the open path, /worktree for explicit return, and a headless source command. Historical selections retain their commit and are validated against that immutable blob before attachment/submission; they never supply authorization to patch current code. Keep current worktree reads and edits separate, preserve navigation/drafts and test real commits, drift, excluded history and native rendering.

### Measured session storage status

Correct the retention scan to bound every filesystem entry, reject changing/symlink directory traversal and identify managed trace ZIPs. Expose read-only per-session and data-directory apparent-byte totals, sampling time, default thresholds and explicit advisory global budget status through sessions storage and terminal /storage. Never scan/delete retained checkout source as disposable session storage. Do not turn failed or incomplete scans into passed usage evidence. Verify actual metadata/capture/video/trace files, symlink scope, no canonical writes and public projections before implementing reviewed file export.

### Exact session snapshot file export

Build a deterministic canonical-prefix export with a snapshot timestamp, event count/hash, pending-effect IDs and incomplete-tail count. Preview exact output SHA/size and a new absolute JSON destination outside session storage and Git worktrees; revalidate after approval. Share the already-tested anchored temporary-file/no-replace publication with inspection archives because both current features need the same boundary. Persist session export intent/result separately from application effects; interrupted output stays unknown and is never automatically retried. Existing stdout session export remains available. Test stale/denied grants, existing destination/source preservation, actual JSON snapshots and both native surfaces.
