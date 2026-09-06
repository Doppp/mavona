# Session and artifact retention

**Status:** Initial configurable defaults; revision 6

## Ownership and defaults

Session metadata, event logs and decision/check summaries persist until the user archives or deletes them. Large artifacts are managed separately. Initial warning budget: 2 GiB per user data directory; hard capture budget: 5 GiB total and the per-run App Inspection limit. Report disk use by category through session settings and a headless status command. These are configurable product defaults, not measured usage predictions. Keep video opt-in per flow/session and show expected capture size where estimable. Display separate video/trace/screenshot totals. Calibrate defaults from measured representative captures and document any change; do not silently raise limits or enable recording.

Warn at 80% of the hard limit. At the hard limit, stop new large captures/spillover and mark affected required checks unknown; never delete evidence silently or let unlimited output exhaust disk. Reserve space for an error/checkpoint where possible. Ordinary reads and existing evidence review continue.

## Archival and expiry

After 30 days of inactivity, offer archive; do not auto-archive active or pinned sessions. Offer large-artifact expiry after 90 days under an explicit opt-in retention policy. Preserve a tombstone with artifact ID/hash, original provenance, expiry time and reason. Historical check execution remains recorded, but deleted evidence is marked unavailable for review and cannot be presented as a fresh verification. Compaction never acts as evidence deletion.

Archival moves data out of the active index and may create a local export; it does not change repository code. User deletion has a clear scope preview and removes Mavona-owned records only. Provide export before deletion, cancel controls and pinning. Authentication state is excluded from reports and follows its own shorter expiry/logout policy; never retain it as audit evidence.

## Removed source recovery

Approved source deletion retains the original entry in a private `.mavona/recovery/` directory in the owning checkout and records its relative recovery path in the effect result. These are user source bytes, not disposable inspection artifacts. Session archival, compaction and artifact expiry do not delete them. Recovery and permanent removal require an explicit scope preview; restoration must never overwrite a current path. Interrupted or ambiguous moves remain unknown until reconciled.

## Acceptance

Simulate warning/hard-limit transitions, interrupted writes, pinned sessions, artifact expiry and replay with missing artifacts. Preserve valid event logs and distinguish unavailable evidence from failed checks. Disk-full recovery must not invent a successful capture. No artifact download or model call occurs merely to inspect an archived session.
