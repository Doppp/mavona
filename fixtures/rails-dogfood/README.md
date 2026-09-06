# Canonical Rails dogfood fixture

This test-only Rails 8.1.3.1 app supplies ordinary product checks for the request: “Let customers reschedule an order.” The implementation is a baseline for harness and inspection exercises, not evidence that a model independently implemented the feature.

The app follows `current_customer.orders.find` for authorization, persists a future `scheduled_on` date, returns a 422 Turbo frame for invalid dates, and uses Stimulus for date feedback. The fixture-only identity selector is deliberately not production authentication. Boot rejects every environment except explicit `RAILS_ENV=test`, and rejects `DATABASE_URL`.

Installed dependencies are pinned in `Gemfile.lock`. On the measured macOS arm64 host, Ruby 4.0.6 and all pinned gems were already present. Locking used `bundle lock --local`; no network installation was needed. Other platform binaries are unverified.

From this directory, with a configured Ruby 4.0.6 executable:

```text
ruby bin/check
ruby bin/serve
```

`bin/check` prepares `tmp/dogfood_test.sqlite3` and runs model/integration tests. `bin/serve` prepares and inserts missing seed records in the separate `tmp/dogfood_browser.sqlite3`, enables CSRF protection, and binds only `127.0.0.1:4317`. Override the port with `DOGFOOD_PORT`. Neither script resets a developer database or starts background writers. Stop the owned server with SIGINT.

Browser flow:

1. Open `http://127.0.0.1:4317/session/new`.
2. Select “Alice” in “Customer” and activate “Sign in”.
3. Open Alice's order link.
4. Verify “Choose a future date.” (Stimulus connected).
5. Fill “New date” with a future ISO date and activate “Reschedule order”.
6. Verify the confirmation and scheduled date, then reload and verify persistence.
7. Submit `2000-01-01`; verify the future-date error. The stored date must remain unchanged.
8. Sign out, select Bob, and attempt Alice's order URL; expect 404.

`PATCH /orders/:id/reschedule` is the canonical mutation endpoint. Order and customer IDs are database identities and should be discovered from their actual links/select options, not inferred from position. The tests use named Rails fixtures for stable identities.

The Rails checks independently assert actual persistence, invalid-date rejection, wrong-customer authorization, unauthorized requests, and Turbo/Stimulus server markup. Server markup does not establish JavaScript execution. Cross-engine browser execution, inspection evidence, agent patch provenance, and the full App Inspection acceptance matrix require separate evidence. This directory contains no protected graders.
