# Mavona v2 Terminal Interface Specification

**Status:** Normative UX target
**Framework:** OpenTUI Core + `@opentui/solid` + SolidJS

## 1. Experience principles

The interface should feel closer to Pi's restrained transcript than a terminal IDE, while using OpenTUI's stronger layout, focus and overlay primitives.

1. The conversation and work are primary; chrome is quiet.
2. Rails intelligence appears at the moment it explains a decision.
3. Provider, model, locality and task truth remain visible.
4. Progressive disclosure keeps ordinary work compact.
5. Keyboard behavior is consistent and discoverable.
6. Streaming never steals input focus.
7. Approval describes consequence, scope and exact action.
8. Verification is visually distinct from model prose.
9. Colour reinforces meaning but is never the only carrier.
10. Every screen has a usable 80×24 form.

## 2. Default screen

```text
 Mavona  repo: shop  branch: feature/reschedule       LOCAL  qwen3-coder:30b
──────────────────────────────────────────────────────────────────────────────

 You  Allow customers to reschedule an order from the account page

 Mavona  Inspecting Rails application…
   Rails 8.1 · Minitest · PostgreSQL · Hotwire
   Likely surface  OrdersController, Order, account/order views, 3 tests

 Assistant
 I found the existing cancellation flow and will extend its authorization…

 ▸ read_file  app/controllers/account/orders_controller.rb       completed
 ▾ apply_patch  2 files                                           awaiting
   +24 −3   Review diff                                      [Enter]

 Verification
   ✓ controller test  18 passed · 1.8s
   ? system test      not run: browser dependency unavailable

──────────────────────────────────────────────────────────────────────────────
 > Type a message…
──────────────────────────────────────────────────────────────────────────────
 NORMAL · direct change · 41% context · 2.1k in / 0.8k out · Esc cancel · ? help
```

Layout regions:

- **Header:** product, repository/branch, locality, provider/model.
- **Transcript:** virtualized chronological activity.
- **Composer:** multiline input, completion and attachment/file references.
- **Status bar:** mode, task route, context/usage, current operation and key hints.
- **Overlays/drawers:** approvals, diff, models, sessions, commands, Rails evidence.

The transcript is not split into permanent sidebars at normal widths. Rails evidence, plan and verification open as overlays/drawers and also leave concise timeline cards.

## 3. Responsive layouts

### 120 columns and above

- Full header.
- Transcript plus an optional right drawer no wider than 40% for diff/evidence/plan.
- Composer shows two lines minimum and grows to a configured maximum.

### 80–119 columns

- Single-column transcript.
- Drawers become full-width overlays.
- Tool cards show action, shortened target and state; details expand vertically.

### Below 80 columns

- Compact mode, not an error.
- Header collapses to repository plus `LOCAL`/`REMOTE` and model alias.
- Status hints rotate or show only the active operation.
- Tables render as labelled rows.
- Side-by-side diffs become unified diffs.
- Below the supported minimum (target 60×18), show a dismissible warning but preserve composer, transcript and cancellation.

## 4. Startup states

### 4.1 Repository ready

Render shell immediately, focus composer and stream discovery results into a single `Repository` card. Discovery may continue without blocking text entry. Submission waits only for facts required to route the task.

### 4.2 Not a Rails repository

Show:

```text
Mavona could not identify a Git-backed Rails application here.

Current directory  /path
Detected            Git: yes · Rails roots: none

[Choose directory]  [Run static diagnostics]  [Exit]
```

No generic non-Rails chat fallback.

### 4.3 Multiple Rails roots

Open a searchable picker containing root, Rails version if known and recent Git activity. Selection is task/session-scoped unless saved explicitly.

### 4.4 Interrupted session

Show the most recent compatible session with `Resume`, `Inspect`, `New session`. If Git state differs, default to `Inspect`; mutation remains locked until reconciliation.

## 5. First-run connection

The wizard uses progressive choices:

```text
Connect a model

How do you want to run inference?

› Provider API key       OpenAI, Anthropic, DeepSeek, Qwen, Kimi, GLM…
  Local model            Ollama, LM Studio or a local compatible endpoint
  Subscription           Only officially supported executable integrations
  Custom endpoint        OpenAI-compatible
```

Each next screen shows only relevant fields. Before saving, confirmation includes:

- provider and endpoint host;
- `LOCAL`, `REMOTE` or `SUBSCRIPTION`;
- model;
- demonstrated capabilities;
- credential source (`environment`, `this session`, `secure store`), never value;
- whether repository context can leave the machine.

If subscription authentication exists but inference does not preserve Mavona's loop, show it under `Detected but unavailable` with the exact reason. Never lead the user through login and then imply the route can run tasks.

## 6. Composer

### Required behavior

- Multiline editor with grapheme-aware cursor movement.
- `Enter` submits when no completion/approval overlay owns Enter.
- `Shift+Enter` inserts newline; configurable alternative for terminals that cannot distinguish it.
- `Ctrl+J` (LF) inserts newline where modified Enter cannot be distinguished. Plain `Enter` (CR) submits; terminal setup diagnostics verify the distinction. Do not rely on `Ctrl+Enter` as a universal fallback.
- `Esc` closes completion/overlay first, then cancels active generation after a second explicit press/window.
- `Ctrl+C` cancels the active operation; when idle, first press clears input and second exits.
- Bracketed paste preserves text and never auto-submits.
- Large paste shows a collapsed attachment-like preview rather than freezing the screen.
- Draft persists before task submission and through provider errors.
- Undo/redo, word movement, start/end, delete word and kill-line behavior follows common shell/editor expectations.

### Completion

- `/` opens command completion.
- `@` opens repository file completion, scoped initially to relevant Rails surfaces but searchable across allowed files.
- `#` may reference a prior evidence, tool or diff item only after user testing demonstrates value.
- Completion never inserts secret files excluded by policy.

## 7. Transcript items

Every item has a stable ID and selectable/copyable textual representation.

### User message

Plain text with attachments/references. Editing a submitted message creates a new branch/fork event; it does not rewrite history.

### Assistant message

Stream Markdown with conservative terminal formatting. Code blocks show language, wrapping state and copy/save actions where supported. Partial Markdown must render without jumping excessively as delimiters arrive.

### Reasoning status

Show concise states such as `Inspecting routes` or `Choosing verifiers`. Do not expose hidden chain-of-thought. Provider reasoning content, when explicitly supplied for display, is treated as ordinary bounded provider output under its contract.

### Rails finding

```text
Rails evidence · high confidence
Order uses AASM transitions; nearby controller actions call `may_*?` before mutation.
app/models/order.rb:84 · app/controllers/account/orders_controller.rb:39
```

Findings are expandable and expose confidence basis and provenance.

### Tool call

Collapsed form includes state, tool, target, duration and output summary. Expanded form includes validated arguments, approval, bounded output, artifact link and resulting files/evidence.

States:

```text
queued · awaiting approval · running · completed · failed · cancelled · denied
```

### Plan

Plans display only for `lightweight_plan` or `full_plan`. Steps have `pending`, `active`, `completed`, `blocked` or `skipped`. Plan changes are append-only revisions with a short rationale.

### Verification

Verification cards never reuse assistant styling. Each check shows semantic state, exact command, duration and evidence source. `unknown` uses `?`, not a yellow check mark.

## 8. Approvals

Approval is an overlay that traps focus and pauses only the effect awaiting it, not rendering or cancellation.

```text
Approve file changes?

Scope      2 files inside /shop
Effect     +24 −3
Reason     Add rescheduling action and account UI
Risk       Application code; no migration

[Review diff]  [Approve once]  [Approve this exact scope]  [Deny]
```

For commands show argument boundaries clearly, working directory, environment additions (names only), network intent, timeout and whether Mavona selected it as a verifier.

Approval of a patch is invalidated if the patch changes. Approval of a command is keyed to executable, arguments, working directory and relevant policy flags.

The header/status shows `STRICT` or `SCOPED` policy mode. The policy drawer lists allowed tools, paths, commands, browser origins, budget and expiry; the user can revoke it. An approved scoped policy suppresses equivalent prompts only while all constraints still match. Policy changes are durable events, not hidden UI flags. Measure actual approval wait and repeated prompts as specified in the PRD.

When repository configuration first proposes execution, the approval view shows its source, effective settings digest, exact argv and checkout scope. Offer Approve action, Configure scoped execution or Deny. Explain that test commands execute repository code. Relevant configuration changes reopen review; exact-action approvals also invalidate changed entry scripts. A trusted-development grant remains visibly scoped and revocable as described in `docs/specs/THREAT_MODEL.md`.


## 9. Diff viewer

- Unified view is default and mandatory at narrow widths.
- Side-by-side view is optional at wide widths.
- File list, additions/deletions, untracked/renamed/binary indicators.
- Syntax-aware colour with no-colour semantics.
- Search, next/previous hunk, collapse unchanged context and wrap toggle.
- Pre-existing changes are labelled and never attributed to Mavona.
- Approval can target the complete proposed diff or individual safe hunks only if the patch application model supports atomic hunk identity.
- Very large diffs render lazily and remain available as artifacts.

## 10. Source viewer and external editor — MVP

The supplied mockups guide conversation, source review and App Inspection composition; the normative requirements below remain authoritative.

### Open and read actual files

Provide a fuzzy repository file picker through `/files`, an optional on-demand project tree and `/open <path>[:line]`. File references in messages, diffs, Rails evidence, test failures and stack traces open the exact file/line. Resolve references against the selected repository and validate containment. Do not depend on the model printing a file into the transcript.

The read-only viewer requires syntax highlighting, line numbers, search with next/previous match, go-to-line, line-range selection/copy, wrap toggle, horizontal scrolling when unwrapped and navigation history. Keep recent files reachable without a permanent tab strip. Support optional Vim-style navigation (`j/k`, `gg/G`, `/`, `n/N`) only inside the focused viewer; plain composer input remains ordinary text. Palette commands remain available regardless of binding choice.

At wide terminal widths, show a resizable pane alongside the conversation. On narrow terminals use a full-width overlay; closing restores the draft and prior focus. The user can pin a file and reading position. Agent activity must not steal focus, change the selected file or jump the viewport. Announce file changes and offer refresh; preserve a stable snapshot while selecting text.

### Source, diff and selected context

Switch between full source and a revision-identified diff. Label current worktree, proposed patch or historical snapshot explicitly; historical code must not appear current. Selection records repository-relative path, line range and content digest. Explain, Change this and Add to prompt create a removable draft reference, not an automatic submission. Viewing, searching and copying files makes no provider request and adds no model context by itself.

Before submission, detect changed source against the selection digest. Show the old/new context and require refresh or deliberate use of the labelled historical selection. Preserve excluded-file policy, output size limits and binary/large-file fallbacks. A missing or renamed path produces an actionable message rather than opening a different file by label.

### External editor handoff

Offer Open in editor at the selected path and line. Use a configured editor adapter with explicit argument templates, allowing Neovim and VS Code-style editors without shell interpolation. Do not build or embed a full editor, LSP workspace or Neovim plugin runtime for the MVP. Editing the prompt externally, if offered, must be labelled separately from editing source.

Before handoff, finish or cancel in-flight conflicting tool effects and pause agent mutation. Keep the session/worktree lock owned by Mavona while delegating the user edit. Suspend/restore terminal ownership for a terminal editor; use a wait-capable launch or explicit return confirmation for GUI editors. On return, reconcile file hashes and Git state, identify user changes, invalidate stale patch approvals and verification, then resume safely. Unsaved editor buffers are not evidence of filesystem changes; explain the save/return boundary.

### Acceptance

Open a file from a failed test at the correct line; search and select a range; add/remove it from a draft with zero provider calls; preserve view position through agent output; detect source drift before submission; handle renamed, excluded, binary and oversized files; switch source/diff without confusing revisions; hand off to terminal/GUI editors and reconcile edits without overwrites. Repeat at 80×24 and wide dimensions, with Unicode paths and no-color rendering.

## 11. Rails evidence drawer

Tabs/sections:

- `Project`: versions, database, test framework, jobs, frontend.
- `Task`: affected surfaces and interface map.
- `Conventions`: repository evidence and confidence.
- `Verifiers`: recommended checks and widening path.
- `Legibility`: non-blocking repository improvements.

Raw evidence IDs are available in detail mode but not visual noise in the default view.

## 12. App Inspection interaction

Full App Inspection is part of the MVP. Its runtime contract lives in `docs/specs/APP_INSPECTION_SPEC.md`.

### Transcript and drawer

A compact App Inspection card shows current route, browser/viewport, active step, latest capture thumbnail when supported and assertion counts. It expands into an App drawer with Page, Steps, Captures, Compare and Diagnostics sections. At wide widths it can sit beside the transcript; at 80 columns it is a full-width overlay. Live browser rendering stays in a headed browser window; the terminal shows observations and controls, not a custom browser engine.

The drawer provides start/attach, capture, rerun, browser/viewport selection, takeover/resume, stop, local report and trace actions. Keyboard navigation reaches every action. Manual takeover pauses agent browser input while retaining the terminal session; resumption requires a fresh observation. Setup explains unavailable engines and offers explicit installation. Missing vision support offers DOM mode or explicit model selection.

### Images and comparisons

Use a tested terminal image protocol when available. Without it, show a descriptive card, dimensions and Open image/Open report controls. Full-resolution screenshots, region selection, annotations, zoom, side-by-side and overlay comparison are available in a local report/viewer. Do not build a general graphics framework in the terminal. Keep report binding on loopback with an unpredictable session token; do not expose authentication state or permit arbitrary file paths. Static report export needs no server.

Image attachments from a file path are mandatory; clipboard/paste and drag-in behavior are capability-dependent and have a file-picker fallback. Image references show filename, size, intended provider/locality and removal before submission. Annotation text is attached to a stable capture/region ID. Never resend all images on every turn.

### Evidence truth

Browser action completion, deterministic assertion result and model visual opinion have separate labels. Each check exposes its assertion and artifacts. Show unchecked viewport/engine profiles explicitly. Stale before/after pairs show Not comparable. Diagnostics separate transport failure, HTTP error and policy-blocked request.

### TUI delivery gates

- Milestone 1: composer, streaming timeline, tool/approval/diff and evidence cards.
- Milestones 3–4: real connections, model selection, safe effects and verifier truth.
- Milestone 5: long-session polish, pickers, themes, recovery and accessibility.
- Milestone 6: complete inspection drawer and image/report workflows.
- Milestone 7: packaged compatibility and release validation.

Add acceptance for image-capable and text-only terminals, 80×24 comparison navigation, attachment removal, manual takeover, missing engine, unsupported vision, cancelled capture and no browser effects during session replay. Input latency remains under the existing target while captures and comparisons run. Test scrollback selection/copy, scroll-position preservation and explicit jump-to-latest under rapid streaming; new output must not pull a reader away from older content.

## 13. Provider and model picker

Rows include provider, model, connection, locality, context window, tool support and credential source. Sort connected and compatible models first. Never label a model compatible solely because it appears in `/models`; tool capability must be declared, observed by bounded preflight or explicitly overridden.

Switching model mid-task requires confirmation when provider semantics, locality or context capacity changes. The event log records the boundary. No automatic fallback.

## 14. Session picker

Search by task text, repository, branch and status. Each row includes updated time, completion truth and locality. Actions:

- resume;
- inspect read-only;
- fork into a new session/worktree;
- rename;
- export;
- archive after confirmation.

Deletion is not an initial shortcut because sessions contain audit evidence. Retention/archival is distinct from deleting repository changes.

Session settings show disk usage, pin/archive/export controls and retention policy from `docs/specs/RETENTION.md`. Expired artifacts display an unavailable-evidence marker. Never show a stale check as fresh merely because the session was resumed.

## 15. Error and recovery UX

Errors answer four questions:

1. What failed?
2. What state remains trustworthy?
3. Was anything changed or sent?
4. What can the user do next?

Examples:

- Provider timeout: draft and tool state preserved; retry same provider or choose model manually.
- Rails boot failure: static inspection remains available; list unknown runtime facts.
- Tool command failure: show exit and captured output; do not call it verification passed.
- Event recovery: explain an incomplete trailing event was ignored and show the reconciled Git state.
- Native TUI fatality: restore terminal, print session ID and `mavona resume <id>`.

## 16. Keyboard map

| Key | Context | Action |
| --- | --- | --- |
| `Enter` | composer | submit |
| `Shift+Enter` | composer | newline |
| `Ctrl+J` | composer | newline fallback |
| `Esc` | overlay/completion | close |
| `Esc` twice | active task | cancel with feedback |
| `Ctrl+C` | active task | cancel |
| `Ctrl+C` twice | idle | exit |
| `Ctrl+P` | global | command palette |
| `Ctrl+O` | global | session picker |
| `Ctrl+D` | global | diff |
| `Ctrl+R` | global | Rails evidence |
| `/verify` or palette | global | verification; preserve terminal paste bindings |
| `Tab` / `Shift+Tab` | overlay | next/previous focus |
| `/help` or palette | global | contextual help; `?` remains ordinary composer text |

All bindings are represented as semantic commands through the pinned supported OpenTUI keybinding facilities; verify package/API availability in the spike. Components do not scatter raw key comparisons. Global shortcuts yield to focused text-editing conventions; every action is also available through the palette.

## 17. Colour and accessibility

- Respect `NO_COLOR` and terminal capability detection.
- Provide high-contrast default dark/light themes.
- Statuses include text/symbol, never colour alone.
- Focus uses both shape and colour.
- Avoid animated spinners when reduced-motion configuration is set; use changing text/status instead.
- Copyable transcript text excludes decorative glyphs where possible.
- Test CJK, combining marks, emoji, RTL display limits and IME input explicitly. Unsupported RTL editing behavior must be documented honestly.

The v0.1 composer accepts the UTF-8 text emitted when a terminal IME commits a composition. CJK, emoji and combining sequences are preserved, and right-to-left text is retained in logical order when entered as its own line. OpenTUI and the terminal own glyph shaping and bidirectional cursor movement. Mixed left-to-right/right-to-left editing next to combining marks is unsupported because the current editor can reorder the mark in its backing text; use a separate line or compose that text in an external editor before pasting it atomically.

## 18. Rendering and performance

- Virtualize transcript and long tool output.
- Keep canonical content outside component instances.
- Batch adjacent text deltas on a short frame window while recording all domain order.
- Do not re-render the entire transcript on composer keystrokes.
- Avoid syntax re-highlighting unchanged blocks.
- Spill output beyond configured byte/line limits to artifacts.
- Preserve input at 30+ output updates per second.

## 19. TUI acceptance scenarios

1. Launch at 80×24, enter a multiline task and receive a streamed fake response.
2. Continue typing while rapid output and a tool call render.
3. Review and approve one diff, then observe a Rails finding and verification result.
4. Paste 10,000 characters without auto-submit or lost input.
5. Resize repeatedly between 160×50 and 60×18 with no crash or unusable modal.
6. Enter CJK text through IME plus emoji and combining characters without loss.
7. Cancel model streaming and a long child command; terminal remains usable.
8. Crash at each recorded lifecycle point, reopen and replay deterministically.
9. Run the same fixture headlessly and compare domain-event sequence.
10. Package the app and repeat startup/cleanup on each supported target.
