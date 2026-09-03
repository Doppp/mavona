# Mavona

**A Ruby on Rails coding harness that lets you bring your subscription, API key or local model.**

Mavona gives an AI model a Rails-native way to inspect, plan, change and verify a real application. It combines a focused terminal interface with repository discovery, constrained context, Rails-aware tools and evidence-based verification.

> [!IMPORTANT]
> Mavona is pre-release software. Provider connections and the interactive TUI described below are the target experience for the current implementation milestone. Until that milestone lands, consult the checked-out version's command help and release notes for the functionality that is actually available.

## Why Mavona?

General coding agents can edit Rails applications, but they still have to rediscover the same conventions on every task: where behavior lives, which framework defaults matter, which tests provide useful evidence and how a change crosses models, controllers, jobs, mailers and views.

Mavona supplies that missing Rails-specific harness. It is designed to help capable models work with less irrelevant context, make narrower changes and prove what they actually verified.

Mavona is not a hosted model service. You choose how inference is provided:

- an existing subscription through an officially supported integration
- your own provider API key
- a local model running on your machine

## Installation

Mavona requires Ruby and is intended to run from the root of a Ruby on Rails application.

When the gem is published:

```sh
gem install mavona
```

To work from the repository:

```sh
git clone https://github.com/Doppp/mavona.git
cd mavona
bundle install
bundle exec exe/mavona --help
```

The source command above is provisional and must match the executable shipped by the repository.

## Quick start

Enter a Rails application and launch Mavona:

```sh
cd my-rails-app
mavona
```

On first launch, choose how you want to connect a model:

```text
Welcome to Mavona.

How would you like to connect a model?

  1. Use a subscription
  2. Enter an API key
  3. Use a local model
  4. Configure a custom endpoint
```

Once connected, describe the change you want:

```text
> Allow customers to reschedule an order from the account page
```

Mavona inspects the application, builds a focused Rails context, proposes or follows a plan, makes approved changes and runs the relevant verification. A check that did not run is never reported as passed.

## Connecting models

### Subscription access

Mavona can use a consumer or workspace subscription only where the provider offers an official, permitted integration.

The first supported subscription path is ChatGPT through Codex. Mavona uses the official Codex authentication flow; it does not copy or inspect another application's stored tokens.

From the TUI:

```text
/connect
```

Then select:

```text
Subscription → ChatGPT → Sign in with Codex
```

If Codex is not installed or authenticated, Mavona explains what is missing and starts the official login flow when possible.

Availability depends on the provider's current terms and supported interfaces. A general chat subscription does not automatically imply that third-party harness access is permitted.

### API keys

Mavona supports direct provider credentials and OpenAI-compatible endpoints. The initial provider set is expected to include:

- OpenAI
- Anthropic
- DeepSeek
- Qwen / Alibaba Cloud
- Kimi / Moonshot
- GLM / Zhipu
- OpenRouter
- custom OpenAI-compatible services

Run `/connect`, choose the provider and enter the key when prompted. Mavona recognises supported environment variables before asking for a key.

Credentials never belong in `.mavona.yml`. Interactive credentials are stored in the operating-system credential store when supported. If secure persistent storage is unavailable, use a session-only credential or the provider's environment variable.

### Local models

Mavona supports local inference through:

- Ollama
- LM Studio
- llama.cpp
- vLLM
- another OpenAI-compatible endpoint

For example, with Ollama:

```sh
ollama serve
ollama pull qwen3-coder:30b
```

Then launch Mavona and select:

```text
/connect → Local model → Ollama
```

Mavona probes conventional loopback endpoints, lists the models reported by the local server and checks the capabilities required by its agent loop.

When local mode is selected, Mavona displays `LOCAL` throughout the session. It does not silently send the task to a cloud provider or fall back to a paid model.

## TUI commands

The main interaction happens inside one Mavona session:

| Command | Purpose |
| --- | --- |
| `/connect` | Connect or manage model providers |
| `/model` | Select the active provider and model |
| `/status` | Show the connection, model, execution mode and capabilities |
| `/logout` | Remove Mavona-owned credentials for a provider |
| `/help` | Show available commands and keyboard controls |

The status line keeps the active execution path visible:

```text
NORMAL | qwen3-coder:30b | LOCAL | plan | context 18%
```

## How Mavona works

Mavona keeps one Rails-specific workflow regardless of the selected model. Its
canonical shape remains:

```text
Understand → Change → Verify
```

The implementation breaks that shape into five concrete stages:

1. **Inspect** the application structure, configuration, conventions and relevant code.
2. **Focus** the context on the smallest useful set of files and runtime facts.
3. **Plan** through narrow interfaces, risks and verification requirements.
4. **Change** the application while preserving existing behavior unless the task says otherwise.
5. **Verify** with relevant tests, static checks and explicit evidence.

Changing from an API model to a local model changes inference, not Mavona's Rails reasoning or verification contract.

## Configuration

Project-specific behavior belongs in `.mavona.yml`:

```yaml
test_command: bin/rails test
lint_command: bin/rubocop

model:
  provider: ollama
  id: qwen3-coder:30b
```

Project configuration may select a provider and model, but it must not contain API keys, OAuth tokens or other credentials.

User-level configuration stores non-secret defaults such as the preferred provider, model and custom endpoint metadata.

## Privacy and safety

Mavona makes the active inference route explicit so you can tell whether code is staying on your machine.

- Local mode permits inference requests only to the configured local endpoint.
- Cloud providers receive the context required for the selected task.
- Secrets are excluded from project configuration and redacted from logs and errors.
- Mavona does not import credentials from Codex, Pi, OpenCode or other agents.
- Mavona does not silently switch providers.
- Repository commands remain subject to Mavona's approval and verification rules.

You remain responsible for reviewing changes and for the data-handling terms of the provider you select.

## What Mavona is not

Mavona is not:

- another model subscription
- an inference reseller
- a generic chat client with a Rails system prompt
- an infinite-agent orchestration system
- a replacement for your application's test suite

Its job is narrower: make supported models better at understanding and safely changing Rails applications.

## Development

Run the repository's documented setup and test commands before submitting a change. Provider tests must use deterministic fakes or local stub servers by default; the normal test suite must not require paid API access.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing expectations and contribution guidelines.

## License

See the repository's license file for the terms that apply to Mavona.
