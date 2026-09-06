# Deterministic rewrite acceptance

**Status:** Required before Rails understanding acceptance; revision 5

## Purpose and timing

Preserve accepted v1 behavior without preserving its defects. During Milestone 0 restore the pinned Ruby prototype environment and execute its existing tests. Capture failures, runtime versions and exact commands. Do not change production v1 logic merely to get a green oracle. Classify pre-existing defects and environmental failures; a reproducible baseline or the explicitly approved fallback below is required before Milestone 2 acceptance.

## Broken-oracle fallback

If affected v1 behavior cannot be reproduced after bounded restoration attempts, preserve errors and partial raw observations. Define independently reviewed, hand-specified expected behavior from product requirements and isolated fixtures for those areas. Extend the manifest with `oracleStatus` (observed-v1 or specification-fallback), reason, attempted restoration, reviewer and behavioral tests. This resolves the acceptance obligation through specification coverage, not a claim of differential parity. Report observed-v1 versus fallback coverage separately. Unexplained v2 mismatches against working goldens remain blocking; fallback cannot excuse a regression. The technical work breakdown sets the restoration effort ceiling and records whether further recovery is worthwhile.


## Corpus

Use every available deterministic Rails fixture plus the three pinned repositories from the nine-task smoke corpus when reproducible. Add focused fixtures for namespaces, custom autoload paths, engines/multiple roots, schema formats, Minitest/RSpec, boot failure, missing Ruby, older Ruby, dirty/untracked files and container-only Ruby. Do not assert v1 supports a case until executed evidence exists.

Start with at least 50 task/fixture pairs selected to cover distinct routing and verifier behaviors, not 50 arbitrary rephrasings. Include direct/light/full routes, refusal cases and low-confidence widening. Freeze a coverage manifest; count alone cannot establish completeness.

## Golden format

Store `parity/v1/<fixture>/<case>.json` with schema version, fixture commit/content digest, v1 commit, runtime fingerprint, input task/request, normalized project profile, evidence, route and verifier recommendations. Preserve raw outputs as artifacts. Record commands, exit status and known failures. Canonicalize object keys and unordered sets, map absolute roots to stable fixture tokens and remove volatile times/generated IDs using a versioned normalizer. Preserve semantically meaningful ordering, confidence, missing values and error states.

Goldens are immutable historical observations. V2 expected output is derived through a reviewed divergence manifest; never overwrite the old oracle to hide a mismatch.

## Divergence manifest

Each entry has `id`, `fixtureId`, `caseId`, `jsonPointer`, `v1Value`, `expectedV2Value`, `classification`, `rationale`, `authorityReference`, `testReference` and review status. Classification is regression, deliberate change, v1 defect or unresolved. Regressions must be fixed. Deliberate changes cite the normative requirement. V1 defects retain the old observed value and separately tested corrected expectation. Volatile normalization rules also require review.

## Acceptance and deletion

Run the v2 discovery, routing and verifier selection interfaces against identical inputs. Every relevant mismatch must resolve to accepted intentional change or tested v1 defect; no regression/unresolved mismatch may pass. Exercise provider contracts separately with deterministic stubs; do not compare stochastic model prose. Archive v1 source, fixtures, raw observations, normalizer and manifests before retiring the implementation. Retirement requires mechanical parity acceptance and protected smoke grader semantics, not simply a date or a passing new test suite.
