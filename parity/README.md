# Frozen Ruby observations and deterministic Rails comparison

`corpus.ts` freezes 50 distinct task/fixture pairs. Its fixture declarations are executable test inputs, not application dependencies. Coverage includes Rails source surfaces, explicit/custom paths, namespaces, nested apps/engine dummy roots, schema formats, mixed/absent frameworks, scoped verification configuration, refusal/broad-task cases and dirty/untracked source. The old/container Ruby cases currently exercise declarations without executing those runtimes; they are not native/container runtime evidence.

`v1/` contains immutable historical observations from commit `fdee1136acd7863885ed20c6760f61674f7e32c5` and Ruby 4.0.6 on Darwin arm64. Each golden includes the input/declaration digest, runtime description, full normalized discovery/profile/evidence, analysis and pure verifier recommendations. Its adjacent raw artifact preserves exact argv, stdout/stderr and exit status. The observation script calls the legacy pure `inferred_commands` method; it never calls `Verifier#run`, requires the application, or boots Rails. These are differential routing/recommendation observations, not functional Rails verification or inference benchmarks.

The first observer passed the Git root to the legacy analyzer even for a selected nested application. `multi-root-shop`, `multi-root-admin` and `engine-root` consequently contain exit-1 observations with partial discovery. Those remain unchanged. A second observation (`routing-selected-root.json`) passes the selected application root to the existing legacy library interface and succeeds. This corrected observer calling convention, not v1 production logic. Comparison uses that second observation for those three cases. All other first observations succeeded; there is no specification fallback in this corpus. Capture checks every archived `lib/` byte against the pinned Git object before running.

Normalizer version 1 sorts object keys, preserves array ordering/confidence/missing values, maps the known fixture root to `<FIXTURE_ROOT>`, maps opaque identity/time fields consistently, and replaces the timing measurement object with a labelled token. Raw outputs remain available. Review accepted these volatile-only rules on 2026-09-07; no semantic confidence or outcome is normalized away. `observations.sha256.json` protects all 106 original/corrected golden and raw artifacts against accidental changes. Capturing refuses existing files.

Projection version 1 compares task status, selected root, locked Rails version, framework evidence, planning mode, ordered nominations and actual recommended argv/cwd. Legacy app-relative paths are explicitly mapped into the same repository-relative coordinate system; no reordering is hidden by the projection. `divergences.json` records the exact before/after value, classification, rationale, normative authority and test for each accepted difference. The implementation source/specification review is recorded explicitly; it is not an external human review. New, changed, stale or unresolved differences fail the strict command:

```sh
bun test tests/parity.test.ts tests/routing.test.ts
bun scripts/parity/verify.ts
```

To capture into a new destination, using an independently archived copy of the pinned Git commit:

```sh
bun scripts/parity/capture.ts ARCHIVED_V1 RUBY_EXECUTABLE NEW_OUTPUT_DIRECTORY
```

The optional trailing comma-separated fixture IDs and output tag allow an additional observation without overwriting an existing one. Do not regenerate historical observations after changing product behavior. Comparison scratch output belongs outside the checkout:

```sh
bun scripts/parity/compare.ts /tmp/mavona-parity-comparison.json
```

This projection does not complete all PARITY/RAILS acceptance: remaining obligations include the three pinned smoke repositories, protected nine-grader result semantics, broader profile/structural comparisons, actual missing/older/container Ruby behavior, runtime boot-failure evidence and the complete release ledger. Passing these 50 comparisons alone does not authorize retiring the inherited Ruby deletion set.
