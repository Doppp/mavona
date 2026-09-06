# Mavona Provider Integration Specification

**Status:** Implemented foundation
**Date:** 3 September 2026

This specification extends the non-mutating 0.1 contract with the inference and interactive-session foundation for 0.2. `SPEC-V0.1.md` remains authoritative for offline discovery and proportional task-analysis semantics.

## Public interface

Running `mavona` opens the terminal session. With no usable provider it presents subscription, API-key, local-model and custom-endpoint choices. `/connect`, `/model`, `/status` and `/logout` manage the current selection. `mavona init` remains offline-capable and `mavona plan` remains explicitly deferred.

The status line always includes the selected model and one of `LOCAL`, `REMOTE`, `CHATGPT SUBSCRIPTION` or `DISCONNECTED`. No colour is required.

## Provider boundary

All executable inference adapters expose connection, catalogue, capability, streaming and cancellation operations. They emit normalized text, tool, usage, completion and cancellation events. The Rails prompt, tool executor and approval decisions are provider-independent.

OpenAI-compatible presets share one transport. Anthropic uses its native Messages API. A deterministic fake exercises the same loop without network access.

## Subscription limitation

The official Codex CLI provides documented login status and login commands. Mavona may launch those commands with argument arrays and a controlled environment. It never reads Codex credential files and `/logout` never invokes `codex logout`.

Codex app-server is not used for task inference because its documented surface owns the conversation, tools and approvals. ChatGPT subscription execution therefore returns `subscription_agent_loop_unsupported` until a supported lower-level inference surface exists.

## Credentials and configuration

Credential resolution is:

1. provider-standard environment variable;
2. session-only Mavona entry;
3. Mavona-owned operating-system credential entry.

macOS Keychain is the current persistent implementation. Persistence is opt-in. User JSON and project YAML reject keys whose names indicate credentials, secrets, tokens or passwords.

## Local invariant

Local adapters accept only literal loopback addresses and `localhost`. This check runs before every model-list and inference request. Detection probes only conventional Ollama and LM Studio loopback endpoints and sends no prompt, filename or repository content. Capability preflight is bounded and contains only a synthetic tool name.

No provider fallback or automatic routing exists.

## Verified reference surfaces

The implementation was checked against the current [OpenAI Codex authentication documentation](https://learn.chatgpt.com/docs/auth), [Codex app-server protocol](https://learn.chatgpt.com/docs/app-server), [OpenCode provider UX](https://opencode.ai/docs/providers), and the canonical [Pi provider documentation](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md). These references inform interaction grammar and supported boundaries only; Mavona does not copy provider credentials or source code.

## Evidence status

Repository commands return `passed` or `failed` from their real exit status. Before inference, deterministic task analysis selects a bounded context packet and routes work to `direct_change`, `lightweight_plan` or `full_plan`. After an approved write, configured checks run independently; without explicit commands, Mavona selects focused conventionally named Rails tests and relevant lint checks. Every result preserves `passed`, `failed` or `unknown`.

Canonical task state is written beneath `.mavona/tasks/<task-id>/`. It stores task state, evidence, bounded context, an optional plan, application changes and normalized verification. A repository-scoped non-blocking lock enforces one mutable Mavona task at a time. `.mavona/` artifacts are not reported as application changes.
