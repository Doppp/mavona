# Mavona contributor instructions

- Use `mise exec` for Ruby commands.
- Treat `SPEC-V0.1.md` as the current behavior contract, `DECISIONS.md` as settled architecture, `ROADMAP.md` as sequencing, and `VISION.md` as durable intent.
- Keep the agent-facing policy short. Put Rails understanding, context selection, planning depth and verification in the harness when they can be determined mechanically.
- Prefer target-application conventions, then standard Rails mechanisms, then new abstractions only when justified.
- Start with narrow repository evidence and widen only when evidence or independent verification requires it.
- Preserve `passed` / `failed` / `unknown` semantics; agent narration is not verification.
- Keep Phase-0-gated task-routing and verifier heuristics out of the unconditional discovery layer.
- Prefer Ruby stdlib and existing dependencies. Mavona Core is not a Rails application; do not add Rails, Node.js or browser automation as core framework dependencies.
- Default CI must not require a paid coding agent, model API or network access.
- Do not introduce repository mutation, repair loops, runtime test impact, critique agents or other future-release capabilities unless the task explicitly authorizes them.
- Preserve unrelated changes, validate public behavior, run relevant tests and report only verification actually performed.
