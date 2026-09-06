# External engineering preview policy

**Status:** Required for opt-in external preview distribution · revision 5

## Audience and purpose

External Rails developers may opt into engineering previews before the complete MVP exists. Use them to evaluate real workflows and expose usability/integration defects. Preview availability does not redefine MVP scope or substantiate benchmark uplift. The full code-viewing, TUI and App Inspection contract remains the completed MVP target.

## Release-specific declaration

Each preview records its build ID, supported OS/architecture/terminal combinations, actually working features, incomplete features, known limitations and exact installation/removal instructions. Include the tested provider paths, session-format compatibility, recovery limitations and model costs. Do not advertise all engines/platforms simply because dependencies provide binaries. A fake-provider scaffold is labelled a demo, not a usable coding preview.

## Minimum quality gate

- A real supported provider completes a bounded Rails task on an isolated fixture.
- Credential handling, untrusted configuration approval, scoped execution and egress rules pass on the advertised path.
- Cancellation restores terminal ownership, records uncertain effects honestly and preserves user changes.
- Verification cannot report unknown/skipped checks as passed; check provenance is visible.
- Session persistence and restart behavior are tested; any unsupported migration refuses safely and provides a documented export/recovery route.
- Tests cover the declared platform subset and install/uninstall behavior; artifacts have checksums.
- The preview clearly identifies incomplete App Inspection/code-viewer capabilities and forbids production-operation claims beyond the tested scope.

A feature may be absent in a preview. A present feature may not bypass its safety boundary under the label experimental. Known serious credential leakage, unauthorized execution or false-verification defects block distribution.

## Support and feedback

Before publishing a preview, designate a maintainer and a concrete repository issue/discussion channel. Publish best-effort support expectations, known issues and withdrawal/upgrade instructions; promise no response-time SLA unless staffed. Default to no automatic telemetry. Provide optional redacted diagnostic export for user review before sharing; never upload code, traces or credentials silently.

## Relationship to milestones

Technical feasibility unblocks the first interactive slice. A usable external preview normally follows real providers, tools and verification plus the required session/recovery subset. Evidence-pilot status is disclosed separately; a preview may collect UX feedback but cannot imply comparative uplift. There is no treatment-investment gate. External users may review mockups and inert interface demos from the beginning, separately from the runnable-preview safety gate. Full MVP designation still requires every PRD release criterion.
