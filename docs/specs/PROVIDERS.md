# Mavona v2 Providers, Authentication and Local Models

**Status:** Product and safety contract
**Source baseline:** Existing Mavona Ruby prototype at `0.2.0.alpha.1`

## 1. Principle

Mavona owns the Rails agent loop. A provider supplies model inference; it does not take over repository discovery, tools, approvals, task state or verification.

Changing providers changes inference, not Mavona's normalized event, evidence or safety contracts.

## 2. Connection types

### Direct API

Mavona calls a provider's supported inference API using a user-owned key. Native wire adapters are preferred where materially different from OpenAI-compatible APIs.

### Local or user-hosted endpoint

Mavona connects directly to an endpoint chosen by the user. An endpoint marked `local` is technically restricted to loopback. A LAN or remote self-hosted endpoint is `remote`, even when privately operated.

### Subscription

Mavona supports a consumer/workspace subscription only through an official interface that permits Mavona to retain its agent loop and tool ownership. Official login alone is insufficient.

Mavona must never:

- read another tool's credential store;
- extract access tokens from a CLI or browser;
- simulate private OAuth clients;
- route through undocumented consumer endpoints;
- advertise authentication as working task inference;
- call a provider-owned autonomous coding agent and represent it as Mavona's loop.

## 3. Provider matrix

| Provider | Route | Transport | Standard credential | Model discovery | V2 requirement |
| --- | --- | --- | --- | --- | --- |
| OpenAI | API | Native Responses adapter preferred; compatibility adapter only if contract is complete | `OPENAI_API_KEY` | supported API/catalogue | Required |
| Anthropic | API | Native Messages API | `ANTHROPIC_API_KEY` | explicit documented model ID or supported catalogue | Required |
| DeepSeek | API | OpenAI-compatible | `DEEPSEEK_API_KEY` | `/models` when supported | Required parity |
| Qwen / Alibaba Cloud | API | OpenAI-compatible | `DASHSCOPE_API_KEY` | `/models` when supported | Required parity |
| Kimi / Moonshot | API | OpenAI-compatible | `MOONSHOT_API_KEY`, then `KIMI_API_KEY` | `/models` when supported | Required parity |
| GLM / Zhipu | API | OpenAI-compatible | `ZHIPUAI_API_KEY` | `/models` when supported | Required parity |
| OpenRouter | API | OpenAI-compatible | `OPENROUTER_API_KEY` | provider catalogue | Required parity |
| Ollama | Local | OpenAI-compatible plus optional native discovery | none by default | loopback discovery | Required |
| LM Studio | Local | OpenAI-compatible | optional | loopback discovery | Required |
| Custom | Local or remote | OpenAI-compatible | configured environment name, session or secure store | `/models` or explicit model | Required |
| ChatGPT/Codex | Subscription | Official interface only | Codex-owned auth, never copied | interface-dependent | Detected/unavailable until ownership gate passes |

Provider URLs are release configuration, not immutable product facts. Pin and test preset endpoint paths; do not silently change them at runtime from a cloud catalogue.

## 4. Credential precedence

For a provider, resolve credentials in this order:

1. provider-standard environment variable;
2. session-only entry held in memory;
3. Mavona-owned operating-system secure-store entry.

Project configuration may choose a provider/model but cannot contain secrets. User configuration stores non-secret preferences and endpoint metadata only. Keys whose names resemble API keys, tokens, secrets, passwords or credentials are rejected recursively.

Persistent storage is opt-in. Initial platform implementations:

- macOS Keychain;
- Linux Secret Service only when available and testable, otherwise session/environment;
- Windows Credential Manager when Windows becomes supported.

If secure storage fails, Mavona does not silently write plaintext or downgrade a requested persistent save to session storage. It explains the alternatives.

`/logout` removes Mavona-owned session and secure-store credentials plus selection. It does not remove environment variables or invoke another product's global logout.

## 5. Configuration schema

Example project `.mavona.yml`:

```yaml
model:
  provider: ollama
  id: qwen3-coder:30b

verification:
  test:
    command: ["bin/rails", "test"]
  lint:
    command: ["bundle", "exec", "rubocop"]
```

Example user endpoint metadata:

```json
{
  "id": "local-vllm",
  "name": "Local vLLM",
  "baseUrl": "http://127.0.0.1:8000/v1",
  "locality": "local",
  "credentialEnvironmentVariable": "VLLM_API_KEY"
}
```

Any inline credential field is invalid.

Project selection wins over user default selection. Explicit per-command flags win for that invocation and are recorded in session metadata.

Project configuration is a data source, not permission. The `verification` argv above, any boot command and included files require the execution-trust rules in `docs/specs/THREAT_MODEL.md`. Project configuration cannot approve itself, inject credentials or widen provider/browser egress. First-use approval is checkout-bound and keyed to effective execution settings; a separate explicit trusted-development grant may cover the declared execution scope as repository code changes.


## 6. Local-mode invariant

`locality: local` permits HTTP(S) provider requests only to:

- `127.0.0.0/8` literal addresses;
- `[::1]`;
- `localhost` after rejecting userinfo, misleading suffixes and redirects to non-loopback hosts.

Enforcement occurs before every discovery, capability and inference request and after every redirect. Prefer disabling redirects for provider endpoints. DNS resolution is not used to bless an arbitrary hostname as local.

Local discovery probes only conventional configured loopback endpoints with short timeouts. It sends no task, repository text, path or filename. Capability preflight uses a synthetic prompt and tool name with a small output/time budget.

The header/status bar shows `LOCAL` throughout. A local provider failure never causes cloud fallback.

## 7. Capabilities

```ts
type ModelCapabilities = {
  streaming: boolean
  tools: boolean
  instructions: boolean
  structuredOutput: boolean
  contextWindow?: number
  images: boolean
  locality: "local" | "remote" | "subscription"
  source: "preset" | "provider_metadata" | "bounded_preflight" |
          "user_override" | "unknown"
  observedAt: string
}
```

Mavona requires streaming, instructions/system policy and tool use for change tasks. Read-only explanation could later support a reduced capability profile, but no generic-chat bypass exists in the first release.

A model appearing in `/models` proves existence, not tool capability. When trusted metadata does not declare tools, run bounded preflight or refuse. Cache capabilities by provider, normalized endpoint and model with a TTL; show source and allow manual refresh.

User overrides are visible and do not become provider facts.

## 8. App Inspection image input

`docs/specs/APP_INSPECTION_SPEC.md` adds actual image inputs to the normalized request contract: ordered text/image blocks with media type, sanitized artifact ID/hash and size/dimensions. Resolve bytes inside the adapter; never pass arbitrary provider-fetchable URLs from page content. Validate accepted formats, image count, request size and context budget per route. Include image usage when supplied, otherwise unknown.

A demonstrated `images` capability permits selected sanitized captures to accompany the task. A text-only route receives bounded DOM/ARIA/text and deterministic assertion results; it does not receive encoded images disguised as text. Visual interpretation remains unknown when unsupported. Offer an explicit compatible model choice when needed; never silently switch locality or provider. Contract tests cover image serialization, refusal, redaction, cancellation and local no-fallback.

## 9. Normalized provider events

Adapters yield:

```ts
type ProviderEvent =
  | { type: "text.delta"; text: string }
  | { type: "tool.delta"; callId?: string; index: number; name?: string; argumentsDelta?: string }
  | { type: "reasoning.status"; status: string }
  | { type: "usage"; inputTokens?: number; outputTokens?: number; cachedTokens?: number; cost?: Money }
  | { type: "completed"; finishReason?: string }
  | { type: "cancelled" }
```

Provider-specific errors normalize into typed categories: authentication, authorization, rate limit, quota, timeout, connection, malformed response, unsupported capability, context limit, safety refusal and unknown provider error. Redacted provider detail may accompany the category.

Tool calls are not executed until deltas form a complete schema-valid call.

## 10. OpenAI and OpenAI-compatible behavior

V2 should use OpenAI's current supported API natively where it improves tool streaming, usage and cancellation. It should not force Anthropic semantics through an OpenAI shape.

The compatibility adapter must support:

- model list or explicit model ID;
- SSE streaming;
- incremental text and tool calls;
- usage when supplied;
- bearer or optional custom credential;
- bounded timeouts;
- correct cancellation;
- endpoints that omit optional metadata;
- strict malformed-stream handling.

Compatibility means the tested subset, not every vendor extension.

## 11. Anthropic behavior

The native adapter maps:

- Mavona system policy to Anthropic system instructions;
- normalized tool definitions to input schemas;
- assistant tool uses and user tool results to native content blocks;
- text/tool deltas and usage into normalized provider events.

Model selection accepts explicit documented IDs when a general catalogue is unavailable. Mavona must not invent a stale hard-coded list without versioning and source.

## 12. Subscription capability gate

A subscription route ships only if all answers are yes:

1. Is the integration officially documented or provider-approved?
2. Can it deliver inference without exposing/copying private credentials?
3. Does Mavona retain the conversation, Rails context, tool execution and approval loop?
4. Can Mavona independently verify and persist normalized events?
5. Can logout avoid destructive changes to the user's other provider clients?
6. Can the route be integration-tested without misrepresenting account entitlements?

The current Codex bridge passes login detection and login-launch safety but fails question 3 for task turns. Therefore:

- It may appear as `ChatGPT detected` diagnostics.
- Mavona may link to or launch official authentication only when useful for a subsequently supported route.
- It must report `subscription_agent_loop_unsupported` for inference.
- API key and local routes remain the executable alternatives.

## 13. UX contract

`/connect` begins with route type, then provider, then credential source/model. It never asks for an API key if a valid standard environment variable already resolves unless the user explicitly changes source.

`/model` shows only connected/configurable providers and exposes incompatible capability reasons.

`/status` includes:

- provider/model;
- locality;
- endpoint host (not secrets/query credentials);
- connection and capability source;
- context window and estimated usage;
- credential source;
- last provider error;
- fallback: `none`.

## 14. Security and redaction

- Never serialize request authorization headers.
- Keep raw provider request logging off by default.
- Redact known secret values before any error/event/log boundary.
- Redact bearer tokens, common provider key formats, signed URL queries and secret-shaped JSON fields.
- Use allowlisted environment propagation for official CLI bridges.
- Protect against endpoint URLs containing credentials.
- Store endpoint host and path only after validation; show redirects and TLS failures honestly.
- Local HTTP is allowed only on loopback; remote endpoints require HTTPS by default.

## 15. Provider tests

Default deterministic suite:

- every adapter satisfies the same contract;
- chunk boundaries split UTF-8, SSE fields and tool JSON arbitrarily;
- malformed streams and incomplete tool calls fail safely;
- cancellation stops network work and emits one terminal outcome;
- local redirects and non-loopback addresses are blocked before content is sent;
- credential precedence and logout scope are exact;
- config rejects nested secret-shaped keys;
- all persisted/logged events pass a secret-canary scan;
- capability cache keys/expiry/source are correct;
- first-run, model picker and narrow-terminal snapshots are stable;
- no default test contacts a real provider.

Opt-in tests:

- one minimal live request per supported provider;
- model catalogue/capability drift report;
- official subscription integration against an entitled test account when permitted;
- local Ollama and LM Studio smoke tests.

## 16. Explicit exclusions

- Mavona-hosted keys, gateway or billing;
- automatic cost/quality routing;
- secret import from Codex, Pi, OpenCode or browser storage;
- unofficial OAuth;
- cloud fallback from local mode;
- automatic model downloads;
- claiming every OpenAI-compatible vendor is supported;
- embedding provider SDK types in the domain protocol.
