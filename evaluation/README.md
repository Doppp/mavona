# Protected historical smoke evaluation

This is development/release evidence tooling, outside the Mavona agent loop. `smoke/` preserves the nine historical task definitions, grader/support files and three repository pins byte-for-byte. `smoke/provenance.json` records the original Git commit and every artifact hash. The catalog validates these before returning a task. No replacement Ruby application is retained here.

```sh
bun scripts/evaluate.ts --catalog
bun test tests/evaluation.test.ts
```

`scripts/evaluate.ts` accepts an explicit local repository cache, agent argv and configured Ruby executable. It makes a clean detached checkout at the task's pinned commit, never reuses the source checkout's edits, runs the agent behind the available OS filesystem boundary, then grades a fresh separate checkout populated with the frozen post-agent file snapshot. This also prevents a surviving process with the old worktree permission from reading a subsequently installed grader. The inherited grader support installs its randomly named test only during grading and removes it afterward. The grading process has its own restricted filesystem boundary.

Both phases have network disabled and receive no inherited credentials, provider tokens, preload variables or user home. The command currently supports offline/fixture execution; paid/live evaluation remains disabled rather than treating existing credentials as a budget. Runtime setup commands are shown in the catalog and never run automatically. Native `mise`/Ruby/gems must be provisioned separately at the original task's pinned Ruby version. On 2026-09-07, Ruby 3.2.1, 4.0.0 and 4.0.2 were provisioned on Darwin arm64 and all nine original graders reached their intended assertions on the pinned, unmodified application baselines. Every task failed its requested behavior, as expected for these baselines; no agent success or comparative result is established. The demo app additionally requires its pinned frontend asset build before the public-index grader can run. The original grader support discards diagnostic strings shorter than6000characters; a separate observed Open3 wrapper captured actual child output without modifying the byte-preserved graders. Exact evidence and setup limitations are recorded in docs/RELEASE_ACCEPTANCE.md.

Example invocation after explicit local preparation:

```sh
bun scripts/evaluate.ts --task demo_comment_length \
  --source /absolute/pinned/repository-cache \
  --agent '["/absolute/offline-agent"]' \
  --ruby /absolute/ruby \
  --runtime-executable /absolute/mise \
  --runtime-directory /absolute/mise-data \
  --mise-data-dir /absolute/mise-data \
  --condition mavona --attempt 1 --output /absolute/new-result.json
```

`--agent-file` permits a bounded standalone source file for a local fixture agent. Such files are staged privately and use unique basenames; bundle multi-file tools first. The agent receives only task, condition and duration budget on stdin. Runtime directories/executables grant read access only for explicitly configured grading dependencies and cannot overlap protected agent/grader locations. Result files are created exclusively with private permissions. Snapshot bounds are 20,000 entries, depth 30, 16 MiB per file and 64 MiB total; symlinks, hardlinks, special files, concurrent snapshot drift and reserved-home collisions refuse rather than silently omitting potentially defining code.

Predeclared disqualifier: changing an existing `test/test_helper.rb`, `spec/spec_helper.rb`, `spec/rails_helper.rb` (including nested applications) or root `.rspec` invalidates the protected test foundation. This records failed grading with not-run tests before executing the behavioral grader. Agent-written ordinary tests remain diagnostic; these helpers are not silently restored or adopted during evaluation.

`semantics-v1.json` records nine pure legacy result-normalization cases, observed with the pinned Ruby code through `scripts/parity/evaluation-v1.rb`. Local process-result fixtures characterize the reducer; separate tests run actual isolated subprocesses and an actual independent fixture grader. One deliberate correction is required by BENCHMARKS: the old reducer accepted a `passed` JSON claim from a process that exited nonzero. V2 records error/unknown. Paired reporting preserves both-pass, baseline-only, Mavona-only and both-fail cells while retaining attempt identity and unknown counts; duplicate task/attempt/condition outcomes refuse overwriting.

Native evidence currently covers Darwin arm64 only. macOS uses its system sandbox-exec facility with deny-by-default file/network access, explicit system/runtime reads and the owned writable checkout. Linux requires bubblewrap/user namespace support and never falls back to an ordinary process. CI provisions Ubuntu 24.04's pinned `bubblewrap=0.9.0-1ubuntu0.1`, then runs the same isolation tests; this remote job has not been executed. Bubblewrap is an external LGPL-2.1 tool, not linked into or bundled with the standalone Mavona binary. Maintenance/package and CLI references: [Ubuntu package](https://packages.ubuntu.com/noble/amd64/bubblewrap), [upstream CLI](https://github.com/containers/bubblewrap/blob/main/bwrap.xml), [upstream licence](https://github.com/containers/bubblewrap/blob/main/COPYING).

This does not establish all nine Rails task outcomes, all-host protection, live evaluation readiness or full retirement acceptance. Pinned application setup, real grader runs, additional adversarial isolation cases and the release ledger remain required. No provider success or comparative uplift is claimed.
