# Mavona

**A Rails-specific coding harness for AI coding agents.**

Mavona helps coding agents understand the structure, conventions and verification paths of a real Ruby on Rails application before they start changing it.

It is not another coding agent. It is a small layer of Rails-specific context and guardrails around the agent you already use.

## Why Mavona?

General-purpose coding agents are increasingly capable, but they still have to rediscover the same things every time they enter a Rails application:

* how the application is structured
* which Rails conventions it follows
* where relevant behaviour lives
* what local conventions override Rails defaults
* which tests matter
* how a change should be verified
* when they have enough evidence to safely proceed

Mavona gives the agent a compact, evidence-based view of the Rails application so it can spend less time exploring blindly and more time making the right change.

The goal is simple:

> Give a coding agent just enough Rails-specific context to make better decisions.

## Install

Mavona is distributed as a Ruby gem.

```bash
gem install mavona
```

Mavona is intended to be installed as a CLI tool. You do not need to add it to the Rails application's `Gemfile`.

### Development install

If you are working from the Mavona repository:

```bash
git clone https://github.com/Doppp/mavona.git
cd mavona

bundle install
bundle exec exe/mavona --help
```

## Getting started

Go to an existing Rails application:

```bash
cd my-rails-app
```

Run Mavona from the root of the repository.

Start by asking Mavona to inspect the application:

```bash
mavona inspect
```

Mavona examines the Rails application and derives the context that may be useful to a coding agent, such as:

* Rails and Ruby versions
* application structure
* routes
* models and associations
* database schema
* test framework and test layout
* jobs and other Rails components
* repository instructions
* local project conventions
* available verification commands

The important part is not generating a large repository summary. Mavona tries to identify the smallest useful set of evidence for the work the agent is about to perform.

## Try Mavona on a real Rails project

The best way to understand Mavona is to use it on a normal Rails change.

Choose a Rails repository you are comfortable modifying and give your coding agent a small, realistic task.

For example:

> Add an archived state to Projects. Archived projects should disappear from the default index but remain directly accessible. Add tests and preserve existing behaviour.

Try the task once using your coding agent normally.

Then try the same task with Mavona providing Rails-aware context.

Keep the following constant where practical:

* repository
* starting commit
* task
* model
* token budget

Then compare the results.

Did the Mavona-assisted agent:

* find the relevant code faster?
* understand the application's existing conventions?
* touch fewer unrelated files?
* choose an implementation that fits the Rails application?
* identify the right tests?
* verify its work properly?
* require less steering?
* produce a change you would be more comfortable merging?

That comparison is the core Mavona experiment.

Mavona does not need to solve the task itself. The question is whether the **same coding agent makes a better Rails change when Mavona is present**.

## Usage

Mavona is designed to stay small.

Its job is to inspect the repository, gather relevant Rails-specific evidence and expose that evidence to coding agents.

It should not become a second coding agent or a general-purpose agent orchestration framework.

Run:

```bash
mavona --help
```

to see the commands supported by your installed version.

### Inspecting a Rails application

```bash
mavona inspect
```

Use this to see what Mavona understands about the current application.

Inspection is also useful before involving an agent: if Mavona has misunderstood the repository, you should be able to see that rather than relying on hidden context.

### Using Mavona with an agent

Mavona is intended to work alongside coding agents rather than replace them.

The exact integration depends on the agent, but the basic loop is:

```text
Rails repository
      ↓
    Mavona
      ↓
Rails-specific evidence
      ↓
 coding agent
      ↓
    change
      ↓
verification
```

The agent remains responsible for reasoning about and implementing the task.

Mavona helps it enter the repository with better information.

## What Mavona looks for

Mavona favours evidence from the application itself over generic assumptions about how a Rails application ought to look.

Depending on the task, relevant evidence can include:

```text
Gemfile
Gemfile.lock
config/routes.rb
config/application.rb
config/environments/
db/schema.rb
db/structure.sql
app/models/
app/controllers/
app/jobs/
test/
spec/
AGENTS.md
README.md
```

as well as relationships between the files involved in the requested change.

A repository using standard Rails conventions should require very little explanation.

A repository that deliberately departs from Rails conventions should teach Mavona those differences through its own code and instructions.

## Rails first

Mavona is deliberately Rails-specific.

It understands that a Rails application is more than a collection of Ruby files. Routes, Active Record models, migrations, schema, controllers, jobs, conventions, autoloading and tests all provide useful structural information.

That specialization is the point.

Mavona is not currently trying to become a universal harness for every language and framework.

## Principles

### Rails conventions are the prior

Start with Rails conventions and then look for evidence that the application does something differently.

### The repository is the authority

Local code and explicit project instructions beat generic Rails advice.

### Evidence before inference

Where possible, tell the agent what was observed rather than inventing a theory about the application.

### Small context is good context

More repository context is not automatically better.

Mavona should provide the smallest amount of information that materially improves the agent's ability to complete the task.

### Widen only when necessary

Start narrow.

If the available evidence is insufficient, widen the search deliberately rather than loading the entire repository up front.

### Verification is part of the work

A change is not complete merely because code was written.

Mavona should help the agent identify the relevant verification path and distinguish between:

* verified
* failed
* not run

**Not run never means passed.**

### Preserve the agent

Mavona should make existing coding agents better, not reproduce their capabilities.

Reasoning, implementation and most tool use belong to the coding agent.

Rails-specific repository understanding belongs to Mavona.

## What Mavona is not

Mavona is not:

* an autonomous software engineer
* an infinite-loop coding agent
* a multi-agent orchestration framework
* an IDE
* a replacement for Codex, Claude Code or other coding agents
* a giant repository index injected into every prompt
* a framework for every programming language

The project should earn additional complexity before adding it.

## Good first tasks

When trying Mavona, boring Rails work is useful.

For example:

1. Add a validation and tests.
2. Add an association and migration.
3. Add a route and controller action.
4. Change a background job.
5. Modify behaviour spanning a model, controller and tests.
6. Fix a bug where the obvious implementation conflicts with an existing application convention.

These tasks expose whether Mavona is genuinely helping the agent understand Rails applications rather than merely succeeding on impressive demos.

## Evaluating Mavona

A useful comparison is:

```text
same repository
same starting commit
same task
same coding agent
same approximate budget

agent alone
    vs
agent + Mavona
```

Useful outcomes include:

* task completion
* correctness
* independent acceptance
* unnecessary files changed
* unnecessary abstractions introduced
* relevant tests discovered
* verification performed
* agent turns
* token usage
* human steering required

The objective is not to make every number smaller. It is to determine whether Rails-specific harness information produces meaningfully better engineering outcomes.

## Supported environment

Mavona is being developed primarily for modern Ruby on Rails applications and a command-line development workflow.

Early development is focused on macOS and Rails repositories using conventional Ruby tooling.

Broader environment and agent compatibility should be added when real usage demonstrates the need for it.

## Development

Clone the repository:

```bash
git clone https://github.com/Doppp/mavona.git
cd mavona
```

Install dependencies:

```bash
bundle install
```

Run the test suite:

```bash
bundle exec rake test
```

Run the CLI from source:

```bash
bundle exec exe/mavona --help
```

When changing Mavona itself, prefer the smallest implementation that proves the behaviour end-to-end.

Avoid adding infrastructure in anticipation of hypothetical future requirements.

Default CI requires no paid coding agent or external model API.

## Rails agent evaluation

The opt-in smoke suite compares the same Codex agent on nine pinned Rails tasks with and without Mavona context. It uses disposable checkouts, independent hidden graders, structured results, and paired reporting; normal tests never run the paid 18-session suite. See [`docs/evaluation.md`](docs/evaluation.md) for prerequisites and exact commands.

## Status

Mavona is under active development.

The interfaces and commands may change while the core harness is validated against real Rails repositories.

For now, the most valuable contribution is using Mavona on real Rails work and finding cases where its evidence causes an agent to make a better or worse decision.

## Contributing

Bug reports, failing Rails examples and small focused improvements are welcome.

Especially useful reports include:

* the Rails repository or a minimal reproduction
* the task given to the coding agent
* what Mavona surfaced
* what the agent did
* what you expected instead

Examples where Mavona provides **too much**, **too little** or **misleading** context are particularly valuable.

## License

See [LICENSE](LICENSE).
