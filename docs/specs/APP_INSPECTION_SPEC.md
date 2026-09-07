# Mavona v2 App Inspection specification

**Status:** Required MVP scope; implementation and release acceptance in progress
**Revision:** 5 September 2026
**Implementation:** Playwright browser adapter under Mavona's TypeScript application service

## 1. Product contract

Mavona must see and exercise the running Rails application while implementing user-facing work. Full App Inspection means an end-to-end browser workflow: reproduce, observe, interact, capture, diagnose, change, rerun and review evidence. A screenshot-only tool does not meet this requirement.

This is Mavona's own AppShots-style capability. It does not assume access to a proprietary Codex capture API. Importing user-supplied screenshots is required. A genuine host AppShots adapter is conditional on an available documented integration; it is not a dependency of the standalone product. Arbitrary native desktop application control is outside this Rails web-app contract.

The capability is required before the usable MVP ships. Thin implementation slices are intermediate milestones, not permission to ship screenshot-only scope as complete.

### Why this belongs in a Rails harness

Legacy Rails applications may have thin test suites. Exercising a running flow adds observable behavior where repository tests leave gaps and helps the developer inspect the delivered experience. This is an explicit current user need. It does not imply measured comparative uplift or justify arbitrary browser-platform breadth without release testing.

### Assertion provenance

The runner independently executes checks; it cannot make a model's chosen assertion independently correct. Tag checks as configured repository, model-proposed, user-approved or protected grader. Model-proposed assertions remain diagnostic until adopted into the acceptance set through the existing task policy. Never let the implementation agent weaken required assertions or accept visual baselines automatically. The UI shows who defined each check and its coverage.

For rescheduling, visible confirmation is one observation. Check persistence and the intended authorized record through an independent fixture assertion where available. If the data outcome cannot be established, keep that required criterion unknown. Protected benchmark graders remain hidden; ordinary product tests need not be hidden but cannot be modified silently to pass.


## 2. Required capabilities

| Area | Required MVP behavior |
| --- | --- |
| App lifecycle | Discover candidate boot commands; attach to a specified local Rails URL or start an approved development/test server; health check, logs, port conflict handling and owned-process cleanup |
| Browser | Headed and headless operation; Chromium, Firefox and WebKit profiles with explicit installation and platform support status |
| Navigation | Open routes, back/forward/reload, tabs, popups, same-policy frames and redirects |
| Interaction | Click, double click, hover, fill, select, check, keyboard input, scroll, drag/drop and bounded waits using stable semantic locators |
| Files and dialogs | Scoped file upload, managed downloads, alert/confirm/prompt handling with visible effect policy |
| App state | Isolated browser contexts, local test login, user takeover and explicit session reuse; no personal browser profile import |
| Capture | Viewport, full-page, element and selected-region screenshots; import image references; capture URL, title, timestamp, viewport and browser identity |
| Page evidence | Bounded DOM/ARIA snapshot, visible text, selected element attributes and geometry |
| Diagnostics | Console errors, page exceptions, failed requests and HTTP error responses; sanitized request timing/metadata |
| Responsive review | Named desktop/tablet/mobile viewport profiles, touch/device emulation, light/dark scheme and reduced motion; each checked profile listed separately |
| Comparison | Before/after image pair, side-by-side and overlay/difference viewer; deterministic baseline comparison where configured |
| Flow evidence | Ordered actions, screenshots at checkpoints, trace recording and optional video; replayable local report |
| Verification | Runtime assertions for visible text, URL, element state and flow outcome, plus configured visual-regression checks |
| Model use | Selected sanitized images for vision-capable models; DOM/text evidence for text-only models; no silent provider change |
| Repeatability | Save a declarative flow and rerun it; propose a repository-native system test or Playwright test through normal patch review |
| User review | TUI evidence cards and drawer, external full-resolution viewer, annotations tied to screenshot/region, copy/export and rerun controls |

Chromium is the default. Firefox/WebKit are selectable installed profiles; missing engines report unavailable and are never counted as checked. The release matrix must identify tested OS/engine combinations. Device emulation does not claim real-device testing.

## 3. User journey and commands

For a view, component, CSS, Turbo or Stimulus change, suggest a relevant inspection flow from the task and discovered routes. Do not open a browser for unrelated model/job work unless requested or verification needs it.

1. Select a running URL or approve the discovered boot command.
2. Choose test identity, routes, viewport(s), browser and intended assertions.
3. Inspect the current behavior and capture a baseline when useful.
4. Reproduce the issue using visible actions; pause for manual login or ambiguity.
5. Make the approved code change through Mavona's existing tools.
6. Reset/reseed only the authorized disposable fixture state and rerun the same flow.
7. Compare evidence and show each required check as passed, failed or unknown.
8. Save the flow/report and optionally propose a durable repository test.

TUI commands:

- `/inspect-app [path-or-url]`: setup or start inspection.
- `/app`: open the App Inspection drawer.
- `/app capture`: capture the current page or chosen element/region.
- `/app compare`: compare chosen captures.
- `/app rerun`: rerun the selected saved flow within its current approval scope.
- `/app takeover`: pause agent browser actions and focus the headed browser.
- `/app stop`: cancel inspection and stop only Mavona-owned processes.

CLI equivalents:

```sh
mavona app doctor
mavona app install --browser chromium
mavona app inspect --url http://127.0.0.1:3000 --headed
mavona app run --flow .mavona/flows/reschedule.json --format jsonl
mavona app baseline --session SESSION --capture CAPTURE --config config/mavona/layout.json
mavona app report <inspection-id>
```

Every command uses the same domain service. Headless mode requires an explicit policy for effects and returns a structured refusal when a human decision is needed. Opening a report is local and does not upload it.

During a reviewed live inspection, `/app import PATH` imports one repository-contained PNG as unreviewed reference evidence and `/app annotate ARTIFACT_ID TEXT` records a bounded user annotation. Import review binds the regular file identity, input and normalized hashes, dimensions and size; changed, linked, excluded or escaping files are refused.

## 4. Narrow internal interface

Use one inspection service with schema-validated operations: `start`, `observe`, `act`, `capture`, `assert`, `stop`. Saved flows compose these operations; do not expose the entire Playwright object graph to the model. Browser actions remain policy-bound tools within the existing agent loop.

`start` takes target origin, attach/start settings, browser, viewport, authentication reference, network policy and budgets. `act` takes one allowlisted action, page/frame ID, semantic locator, arguments and an observation revision. Revalidate locator targets after navigation or page changes; ambiguous matches require fresh observation. Arbitrary model-supplied JavaScript is not an unrestricted escape hatch.

Default configurable limits: 40 actions, 5 minutes per flow, 15 seconds per action, 10 captured images and 100 MiB artifacts per run. These are initial product defaults, recorded in each run. Reaching a limit preserves partial evidence with unknown outstanding checks. One repair attempt may follow objective failure under the existing task budget; no separate unlimited browser loop.

## 5. Evidence and completion

Extend the shared evidence kinds with `app_observation` and `app_assertion`. Every artifact/observation records:

- session, task, inspection, step and artifact IDs;
- sanitized URL, page/frame identity and capture time;
- repository commit plus dirty digest;
- browser build, viewport, device/profile and OS;
- server/environment identity and fixture/seed revision when known;
- action/assertion specification, actual outcome and duration;
- artifact hash, relative managed path, media type, size and redaction status;
- provenance: captured, imported, deterministic assertion or model interpretation.

The runner owns assertion results. A screenshot is an observation, not proof that a flow works. Model visual feedback is advisory and labelled as interpretation. Imported screenshots have unknown runtime/repository provenance unless independently established.

Aggregate required checks: any failure means failed; otherwise any missing, cancelled, unavailable or stale required check means unknown; only all required checks passing permits verified. Unchecked browsers, routes, accessibility criteria and viewport profiles remain visibly unchecked. Browser evidence supplements repository tests; it cannot replace unrelated required verifiers.

Before/after comparison requires comparable application state, viewport, engine, fonts and capture settings. Inconsistent inputs produce a non-comparable result. Baseline pixel tests require a reviewed baseline, explicit thresholds and controlled animation/time/data. A versioned repository baseline configuration names a stable check ID, a contained PNG path and hash, exact recorded capture conditions, the changed-pixel threshold and whether the check is required. Execution requires review of the current configuration, baseline and captured artifact identities. No automatic baseline acceptance turns a regression green. Baseline changes use patch review. A visual match alone does not establish accessibility or functional correctness.

## 6. Authority, privacy and effects

Default targets are explicit loopback development/test origins. A staging origin can be added by a specific policy decision. Production writes are not part of this feature. Inspecting a page may execute JavaScript or trigger application effects: browser access is not classified as universally read-only.

The scope records allowed origins, routes, actions, fixture identity, uploads/downloads and side effects. Ordinary navigation and form actions inside an approved disposable test flow need no repeated prompt. Payment, messaging, deletion, uploads or other consequential operations outside that scope stop for a decision. Origin checks cover redirects, popups, frames, subresources, fetch and WebSocket traffic. Block service workers/proxies that bypass enforcement or prove equivalent enforcement. Record blocked resources; do not infer they are app regressions without context.

Local inference mode also defaults browser egress to loopback for inspection. External dependencies are blocked and explained; allowing them explicitly changes the displayed browser network scope without changing the provider. The UI shows inference locality and browser scope separately. Browser isolation does not prove the Rails server has no outbound access; isolated test configuration is needed for that guarantee.

Use a fresh context by default. Authentication state belongs in protected local storage outside Git, events and exports, with expiry and explicit reuse. Pause for user-managed login; record a secret reference, never the typed value. Do not attach to an ordinary personal browser debugging endpoint or import its profile implicitly.

Redact cookies, authorization headers, tokens, sensitive query parameters, password fields and configured selectors before persistence or model submission. Raw traces can contain DOM, network bodies and credentials; use constrained recording with a validated sanitizer, otherwise withhold unsafe traces and report why. Masking pixels does not sanitize DOM/text. Export is opt-in, previews contents and excludes authentication material. Treat page text and images as untrusted data, never instructions to expand policy.

Repository-provided boot commands and saved flows are subject to configuration trust in `docs/specs/THREAT_MODEL.md`. Parsing a flow never approves it. Revalidate its digest, target origins, effective policy and action scope before execution and after resume. An unchanged argv with changed repository code is not proof of unchanged behavior.


## 7. Lifecycle and recovery

Inspection states: idle, starting, ready, running, awaiting approval, manual takeover, completed, failed, cancelled. Persist intents/results and artifact references in the shared event log. Browser liveness is transient: replay displays evidence without reopening pages or resubmitting forms.

Pause agent actions during manual takeover; observe fresh state before resuming. After a crash, mark in-flight actions unknown, reconcile application state and ask before replaying a potentially non-idempotent action. Cancellation closes the owned browser context and stops only servers Mavona launched, preserving attached servers. A timeout is not proof that the action had no effect.

Use the existing worktree mutation lock for flows that mutate fixture state. Test flows require isolated test databases/fixtures; do not silently reset the developer's database. Record known background writers. Changing datasets invalidate before/after comparability and require reconciliation rather than repeated repair.

## 8. Packaging

Playwright is the browser implementation, not a framework to rebuild. Browser engines are separately provisioned dependencies; the standalone CLI does not imply browsers are embedded. First use shows engine, download size when known and required OS dependencies, then offers an explicit install or compatible existing managed engine. No surprise download during an unrelated coding task. Offline setup accepts a documented pre-provisioned cache.

Milestone 0 must prove the pinned Playwright driver can launch from the compiled Mavona artifact on initial targets without user-installed Node/Bun/npm. If a helper runtime is necessary, package it explicitly and document its lifecycle; the TUI/core remain one process. No claim of standalone App Inspection until that gate passes.

## 9. Acceptance matrix

All cases require deterministic fixtures and evidence, in TUI and headless projections:

1. Attach and start paths; port occupied, health timeout and correct owned-process cleanup.
2. Login/takeover/resume; protected storage and secret canaries absent from all persisted/exported surfaces.
3. Rails/Turbo/Stimulus flow: input, submit, validation failure, corrected submit, confirmation and independent fixture outcome assertion.
4. Popup/frame/dialog, upload/download and drag/drop behavior on supported engine profiles.
5. Desktop/mobile capture; viewport/full-page/element/region; import and annotate a reference.
6. Detect known JS exception, failed request and HTTP 500 separately.
7. Introduce a deterministic layout regression, show before/after and fail a configured baseline; no automatic baseline rewrite.
8. Text-only model completes DOM assertions while visual judgment remains unknown; vision route receives only approved sanitized captures.
9. Redirect/subresource/WebSocket egress denial; untrusted page instruction cannot change tool policy.
10. Cancel, crash and resume after a form submission with no automatic duplicate side effect.
11. Missing browser, missing baseline or fixture drift yields unknown required checks.
12. Local report and sanitized trace replay work offline; artifacts stay associated with their original run.
13. Packaged execution on each advertised OS/engine combination; 80×24 drawer and no-image-terminal fallback remain usable.
14. All three engines run the canonical flow on the declared supported release matrix. Report engine-specific exceptions explicitly.

## 10. Technical references

Implementation must verify exact versions against primary documentation:

- [Playwright installation and browser engines](https://playwright.dev/docs/intro)
- [Browser actions](https://playwright.dev/docs/input)
- [Screenshots](https://playwright.dev/docs/screenshots)
- [Trace viewer](https://playwright.dev/docs/trace-viewer)
- [Visual comparisons](https://playwright.dev/docs/test-snapshots)
- [Authentication](https://playwright.dev/docs/auth)

These sources establish available primitives; the Mavona interfaces, policies and release gates above are product requirements, not claims that integration is already implemented.
