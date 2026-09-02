# Rails agent smoke evaluation

This opt-in smoke suite asks one narrow question: does the same Codex agent complete the same Rails task more often when its prompt includes Mavona's real discovery output? It is separate from Mavona's normal software tests. The normal tests prove the gem; these runs measure agent behavior in external Rails applications and can consume network access, time, and model usage.

The suite contains nine tasks across three repositories. Every task is run from a pinned commit in two isolated conditions:

- `baseline` sends only the task prompt to Codex.
- `mavona` runs `Mavona::Discovery` in static mode and renders the supported `Mavona::AgentPrompt` before invoking the same Codex command.

Both conditions use the task's same 900-second wall-clock limit. The Codex CLI does not expose a reliable token or turn ceiling for this invocation, so the suite does not invent or record one.

## Initial repositories and tasks

| Repository | Why it is included | Tasks |
| --- | --- | --- |
| [wrocloverb-2024](https://github.com/fractaledmind/wrocloverb-2024) (`478c9ab1…`, MIT) | Compact, conventional Rails and SQLite application using Minitest. | Post title normalization and case-insensitive uniqueness; comment maximum length; publication filtering and ordering in the public post index. |
| [lobsters](https://github.com/lobsters/lobsters) (`2f385d14…`, BSD-3-Clause) | Mature production Rails application with realistic messaging, jobs, and RSpec conventions. | Whitespace-only message subjects; the exact tag JSON key; retry-safe message notifications. |
| [fat_free_crm](https://github.com/fatfreecrm/fat_free_crm) (`059c4d0c…`, MIT) | Mature application with namespaced code and strong local conventions that generic Rails guesses can miss. | Account name normalization; literal SQL-LIKE search; malformed and non-HTTP website handling in a job. |

The complete prompts, commits, budgets, and grader paths live in `eval/tasks/*.yml`. Repository URLs, setup commands, licenses, and selection notes live in `eval/repos.yml`.

## Prerequisites

- Git and `mise`.
- A network connection for the opt-in repository and gem setup.
- An authenticated `codex` CLI for real runs.
- Native build tools, SQLite development files, `pkg-config`, and libvips. On macOS with Homebrew, `brew install pkgconf vips` supplies the two non-system libraries.
- Enough model allowance for the selected runs. The full suite invokes the agent 18 times.

Mavona's own bundle must already be installed (`mise exec -- bundle install`). Target Ruby versions are installed by `eval:setup` through `mise`; target application gems are installed into the corresponding mise Ruby.

## Run the suite

Fetch the pinned repositories, verify each commit, and prove that each app can be prepared:

```sh
mise exec -- bundle exec rake eval:setup
```

Run one task in both conditions:

```sh
TASK=demo_comment_length mise exec -- bundle exec rake eval:run
```

Run one task and one condition:

```sh
TASK=demo_comment_length CONDITION=baseline mise exec -- bundle exec rake eval:run
```

Run all 18 sessions only when that cost is intended:

```sh
mise exec -- bundle exec rake eval:run
```

Then render paired outcomes and aggregate counts:

```sh
mise exec -- bundle exec rake eval:report
```

The default cache is `.mavona/eval`. Override it with `MAVONA_EVAL_CACHE=/absolute/path`, which is useful when several checkouts should share fetched repositories. Remove cached repositories, disposable worktrees, results, and logs with:

```sh
mise exec -- bundle exec rake eval:reset
```

`MAVONA_EVAL_AGENT_COMMAND` can replace the Codex subprocess command for harness testing. It is shell-split into an argument array; it is not evaluated by a shell.

## Isolation, grading, and artifacts

The cache holds read-only Git mirrors. For every condition the runner creates a new shared clone, checks out the task's full commit SHA in detached mode, removes ignored and untracked state, prepares the application, runs the agent, grades the result, records it, and deletes the clone.

Graders remain under Mavona's `eval/graders` tree. Their source and assertions are neither copied into the disposable Rails checkout nor included in either prompt. After the agent exits, the grader creates a randomly named hidden test inside the checkout, executes it, and removes it. Agent-written tests are never the acceptance oracle.

Machine-readable results are stored as `.mavona/eval/results/<task>--<condition>.json`. Adjacent `<task>--<condition>/` directories retain agent stdout, agent stderr, and grader output. The JSON records timestamps, duration, process status, grader and test states, changed files, intervention, and notes. Inspect the logs when a grader reports `failed` or `error`.

States are deliberately explicit: `passed`, `failed`, `not_run`, and `error`. A missing condition or skipped grader is rendered as `not_run` and never counted as a verified completion.

## Known limitations

This is a local smoke suite, not a statistically powered benchmark. It supports one Codex subprocess adapter, serial execution, one attempt per condition, file-based results, and wall-clock budgets. Outcomes can still vary with the agent model and service. There is no token accounting because the current subprocess does not expose reliable counts, no repair loop, no dashboard, and no automatic CI execution of real repositories or paid agents. Establish repeated trials and model/version capture before using these tasks as a Phase 0 benchmark.
