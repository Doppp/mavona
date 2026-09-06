# Trust boundaries and adversarial acceptance

**Status:** Required implementation contract; revision 5

## Assets and authority

Protect user code, credentials, application/test data, spend, approval scope and truthful evidence. The application policy engine and validated domain transitions enforce authority; a model response is never authorization. User-approved policies are versioned and revocable. See `docs/specs/PROVIDERS.md` for provider egress and `docs/specs/APP_INSPECTION_SPEC.md` for browser effects.

| Untrusted input | May influence | Must not control | Enforcement |
| --- | --- | --- | --- |
| Repository configuration, includes and command arrays | Verifier/boot/flow candidates | Execution authority or broader policy | First-use approval, effective settings digest, checkout binding and execution-time policy checks |
| Target repository instructions | Project conventions and proposed plans | Harness safety, secrets, permissions | Scoped ingestion; policy outside model context |
| Source/search/command output | Findings and candidate actions | Direct execution or success status | Bounded output; validated tool requests; runner-owned results |
| Ruby probe output | Facts at declared provenance/confidence | Arbitrary commands, approval scope | Allowlisted requests, subprocess limits and runtime schemas |
| DOM/text/console | Browser observations and proposed next steps | Egress, hidden grader access, credentials | Origin/effect checks on every action; content treated as data |
| Imported images/annotations | User review and suggested changes | Runtime provenance or verified completion | Imported provenance; explicit context attachment |
| Provider responses | Text, proposed patches/tools | Authority to approve its own effects | Validate full calls; independent policy dispatcher |
| Saved flow definitions | Requested browser steps | Arbitrary JS/shell or new origins | Declarative schema, budget and policy revalidation |
| Persisted events/artifacts | Replay and audit | Unsupported safety transitions | Version-aware decoder; refuse mutation on unknown critical state |

Verifier proposals from untrusted inputs may inform selection but cannot remove required acceptance checks. Model-written tests are diagnostic unless adopted through the acceptance policy; protected graders remain inaccessible.

### Repository configuration and execution trust

Repository-supplied `.mavona.yml`, included configuration and `.mavona/flows/*.json` are untrusted data, including in a familiar cloned project. Configuration can nominate commands and flows but cannot authorize execution. Startup may parse/validate configuration without executing it. Configuration precedence is not trust precedence; project files cannot grant themselves broader permissions or override user-level safety restrictions.

Before the first consequential use, show exact argv, resolved executable, working directory, environment additions (secret values redacted), relevant script/flow identity and requested capabilities. Approval is scoped to a specific checkout/worktree and user-selected policy, never transferred merely by repository URL or project name. Record the effective execution-settings digest, flow digest where applicable, policy digest and approval provenance. Changes to execution-relevant settings invalidate prior approval and require a new decision; display-only changes need not.

Provide two explicit choices: approve this action, or permit the listed tests/commands within a scoped trusted-development policy. An action approval checks the resolved executable and identifiable entry-script content immediately before launch; changed identity or bytes invalidate it. Do not claim this digest covers every transitive dependency. Test runners load arbitrary repository code, gems and helpers. A trusted-development grant explicitly authorizes that execution within its declared scope as code changes; it does not imply sandboxing. Where the requested safety boundary requires OS/container isolation, enforce it or refuse rather than trusting argv alone.

Revalidate effective settings, current policy, paths and budgets at execution time, including cached verifier recommendations and resumed sessions. User revocation takes effect before the next action. Headless operation without an applicable explicit grant refuses the effect with a structured approval-required result. Saved flows follow the same approval path and cannot expand origins or actions through configuration. No configuration boolean may auto-approve itself.


## Effects and boundaries

Filesystem checks canonicalize paths and symlinks, including execution-time revalidation. Subprocess calls use argv arrays and sanitized environments; repository-controlled scripts can still execute arbitrary code and need the declared effect policy. A path allowlist alone cannot sandbox a shell command. Rails boot is application code execution, even when the probe contains no writes. Use isolated test resources and OS/container restrictions where required; otherwise disclose the limitation and refuse effects beyond available enforcement.

Browser origin policy covers redirects, frames, popups, subresources and WebSockets. Block uncontrolled service workers and browser proxies or prove equivalent enforcement. Local provider mode does not by itself constrain a separately running Rails server's egress. Prevent personal-profile and authentication-state import by default. Sanitize pixels, DOM, logs and trace payloads before persistence/export/provider submission.

## Required adversarial cases

Test repository text asking to disable policy, tool output with forged result JSON, malformed probe responses, page instructions to exfiltrate credentials, redirect/SSRF and symlink escapes, a saved flow with unapproved actions, provider tool arguments outside scope, unknown approval events on replay, and interrupted non-idempotent effects. Assert no unauthorized effect occurs and no false verification is recorded. Test secret canaries across all evidence/export surfaces. Cancellation/timeout means outcome may be unknown, not necessarily no side effect.

Additional required tests: clone a fixture with hostile `.mavona.yml` and verify startup executes nothing; refuse an unapproved headless verifier; change command configuration after approval; change a referenced script without changing argv; change an included config or saved flow; resume under revoked policy; attempt to carry trust to a new checkout. Exact-action mode invalidates changed entry scripts. Trusted-development mode must visibly retain only its deliberately granted execution scope. Verify no cached selection bypasses authorization.


## Residual risks

This is not a proof against arbitrary code execution in an authorized target script, a hostile OS, malicious installed editor/plugin or a compromised dependency. Record those boundaries, use dependency provenance and isolated fixtures, and avoid claims of universal sandboxing. Security exceptions require explicit scope and remain visible; they cannot erase audit history.
