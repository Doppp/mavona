# Mavona

A Rails-specific coding harness being rewritten in TypeScript 7, Bun and OpenTUI/Solid.

**Development status:** v0.1 is incomplete and has no supported release yet. The replacement now runs configured coding tasks through native/compatible providers, explicit execution approvals and independent checks. It includes persistent sessions, a streaming terminal, local source navigation and scoped Playwright flows. The native source viewer includes Ruby highlighting, fuzzy navigation, pins, diffs and editor handoff. Full parity, recovery, interaction and App Inspection recording acceptance remain in progress. See the [acceptance ledger](docs/RELEASE_ACCEPTANCE.md) for observed evidence and outstanding requirements. The former Ruby implementation remains in Git history at `fdee113`.

## Development

Use Bun 1.4.2 and the exact lockfile. TypeScript 7 strict mode checks application code. Structural parsing uses Ruby 4.0.6 with built-in Prism 1.8.1; unavailable parsing remains unknown and never boots the target application.

```sh
bun install --frozen-lockfile
bun run typecheck
bun run build
./dist/mavona                         # terminal
./dist/mavona inspect /path/to/app --format json
./dist/mavona inspect /path/to/app --task "Change order validation"
```

The terminal supports `/providers`, `/connect provider model`, `/files [query]`, `/open path[:line]`, `/find text`, `/goto line`, `/select start:end`, `/attach`, `/references`, `/detach ID`, `/refresh`, `/back`, `/diff`, `/source` and `/help`. Connection selection makes no inference call; task submission performs a bounded capability preflight. Credentials come from the provider's environment variable or OS secure store. Never enter credentials into the composer. Each effect requests exact-action approval; `/revoke` clears execution grants. `/verify ["ruby","bin/rails","test"]` configures a required check whose execution also requires approval.

Configure an external editor with `/editor terminal ["/usr/bin/vi","{path}"]` or `/editor gui ["code","--wait","{path}"]`, then `/edit` from an open source snapshot. `{line}` is also supported in argument templates. Each launch is reviewed; no shell interpolation occurs. Use the editor's save/quit controls during handoff. GUI ownership persists until explicit return confirmation. Terminal handoff uses `/bin/stty` to restore pre-editor modes even after termination. Saved changes invalidate prior verification and grants; use `/refresh` to update the displayed snapshot. `/reconcile` explicitly records changed repository state before another task; it does not mark pending effects or old checks passed.

Headless tasks require explicit provider/model selection and execution scope:

```sh
./dist/mavona run "Change order validation" --provider ollama --model YOUR_MODEL \
  --allow-write app/models/order.rb \
  --allow-command '["ruby","bin/rails","test","test/models/order_test.rb"]' \
  --verify '["ruby","bin/rails","test","test/models/order_test.rb"]' --format jsonl
./dist/mavona sessions list
./dist/mavona sessions show SESSION_ID
./dist/mavona sessions export SESSION_ID
./dist/mavona resume SESSION_ID
```

A configured remote provider receives repository context when a task is submitted and can incur charges. Locality never changes automatically. Required checks report passed, failed or unknown independently of assistant prose. Task exit codes are 0 verified, 2 decision/approval required, 3 verification failed, 4 unknown/budget exhausted, 5 execution error, and 130 cancelled. Read-only `inspect` returns 0 for a selected Rails root or 2 for unsupported/ambiguous scope.

## Browser inspection and tests

Browser engines are separate from the executable. Provision explicitly; startup never downloads them. Installation prints target/cache/download information and does not install privileged OS packages. Set `PLAYWRIGHT_BROWSERS_PATH` for a pre-provisioned offline cache.

```sh
./dist/mavona app doctor
./dist/mavona app install --browser chromium --dry-run
./dist/mavona app install --browser chromium
./dist/mavona app run --flow path/to/flow.json
# Review the returned complete flow and digest, then approve that exact digest:
./dist/mavona app run --flow path/to/flow.json --approve-flow DIGEST --format jsonl
```

The coding loop exposes `inspect_app` through the same service. The TUI reviews the concrete proposed flow; headless runs can pass `--allow-inspection-flow PATH` to authorize that saved flow once. Changed files/settings or a changed review refuse execution. Model-proposed assertions remain diagnostic, and independent repository checks still determine task correctness. Browser observations/assertions are recorded as canonical events; the full report remains local.

Named `--profile desktop|tablet|mobile` settings include viewport, pixel ratio, touch and mobile layout emulation; `--color-scheme light|dark` and `--reduced-motion reduce|no-preference` are included in the flow approval. Each run lists its selected profile and other unchecked profiles. Emulation is not real-device testing. Saved flows support `tap` for touch interactions. Only explicit loopback development origins are supported. `/app doctor` and `/app run path/to/flow.json` expose the same service in the terminal. Reports and masked captures live under the host-managed session artifact directory. Screenshots do not establish correctness. Use `--trace` and `--video` (or flow `evidence` flags) before reviewing the approval digest to record constrained Playwright traces and masked checkpoint video. Traces omit DOM, source, arguments and network payloads; the pinned upstream offline loader validates each archive. Videos play masked checkpoint frames at 2 fps and do not preserve pauses. Artifact success does not verify application behavior. Open an archive offline with `mavona app replay --trace-file PATH` or `/app replay PATH`; open the printed loopback URL in a browser. The foreground CLI stops on Ctrl+C; the TUI owns one viewer until `/app stop`, Ctrl+C or exit. Replay serves only embedded upstream assets and the selected immutable archive.

Default Bun tests use local fixtures, fake providers and local HTTP servers; no paid models or external Rails repository. Provision browsers first for actual engine tests. The real Rails/Turbo/Stimulus acceptance fixture has its own isolated SQLite test databases:

```sh
bun node_modules/playwright/cli.js install chromium firefox webkit
bundle install --gemfile fixtures/rails-dogfood/Gemfile
ruby fixtures/rails-dogfood/bin/check
bun test
bun scripts/rails-browser-acceptance.ts
MAVONA_TEST_BINARY="$PWD/dist/mavona" bun test tests/cli.test.ts tests/session-cli.test.ts tests/inspection-cli.test.ts
python3 scripts/pty-smoke.py dist/mavona
```

Only Darwin arm64 has observed native packaging evidence so far. Clean isolated browser installation and execution were tested there without Node/Bun on PATH. CI is prepared for Linux and macOS but has not run remotely. Cross-platform support, signing and publication are not claimed.

## Maintained contracts

- [Implementation plan](docs/IMPLEMENTATION_PLAN.md) and [release acceptance](docs/RELEASE_ACCEPTANCE.md)
- [Product requirements](docs/specs/PRD.md) and [architecture](docs/specs/ARCHITECTURE.md)
- [Terminal/source UX](docs/specs/TUI_SPEC.md) and [App Inspection](docs/specs/APP_INSPECTION_SPEC.md)
- [Providers and locality](docs/specs/PROVIDERS.md), [trust boundaries](docs/specs/THREAT_MODEL.md) and [retention](docs/specs/RETENTION.md)
- [Rewrite parity](docs/specs/PARITY.md), [evaluation](docs/specs/BENCHMARKS.md), [preview policy](docs/specs/PREVIEW_POLICY.md) and [glossary](docs/specs/GLOSSARY.md)

Input mockups and historical review material are design inputs outside tracked source. The maintained UX contracts capture the required conversation, code review and App Inspection workflows.

## License

[MIT](LICENSE) — Copyright (c) 2026 Daryl Yeo.

Interrupted effects can be inspected with terminal `/effects` or `mavona sessions show ID`. After inspecting the worktree and any affected application state, explicitly acknowledge it with `/reconcile EFFECT_ID explanation` in the owning session, or `mavona sessions reconcile ID --effect EFFECT_ID --reason "Inspected current state"`. This preserves an unknown outcome and makes prior verification stale; it does not retry the effect. A pending worktree effect blocks new sessions before model preflight.

Source reading supports `/files` or Ctrl+P for fuzzy navigation, `/open path:line`, `/select start:end`, explicit `/copy`, `/pin` and `/pins`. Wide terminals show a source pane adjustable with `/pane 20–40`; narrow overlays retain the conversation scroll position. Ctrl+End returns the transcript to its latest output.

Acceptance criteria are captured before inference and retained across retries. Changed test/spec files or selected criterion files require explicit adoption of their recorded before/after review. In the terminal, inspect `/acceptance`, then use `/adopt REVIEW_ID explanation`; an active task can also present the exact review for approval. Headless users inspect `sessions show ID` and run `sessions adopt ID --review REVIEW_SHA256 --reason "Reviewed the changed criteria"`. A changed worktree invalidates the review. Adoption neither executes commands nor marks correctness passed; execution approval and fresh independent checks remain required.
