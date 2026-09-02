# Contributing to Mavona

Thanks for your interest in contributing to Mavona.

Mavona is a Rails-specific coding harness for AI coding agents. Its goal is to help agents understand, plan and safely modify real Rails applications with less unnecessary context and less blind exploration.

The project is intentionally small. Contributions should improve that goal without turning Mavona into a general-purpose agent framework.

## Before you start

Please read:

* `README.md`
* `AGENTS.md`
* `SPEC-V0.1.md`
* any relevant architecture or evaluation documentation

These documents define the current product boundaries and design principles.

If a proposed change conflicts with them, explain why the boundary should change rather than quietly working around it.

## What makes a good contribution

Good contributions are usually narrow and evidence-driven.

Examples include:

* fixing incorrect Rails repository detection
* improving evidence selection
* reducing unnecessary context
* handling an unsupported Rails convention
* improving verification behavior
* adding a reproducible failing Rails example
* adding or improving an evaluation task
* improving hidden acceptance graders
* fixing CLI behavior
* improving error or refusal states
* improving documentation where the current behavior is unclear

Some of the most useful contributions are cases where Mavona behaves badly on a real Rails application.

If Mavona gives an agent too much context, too little context or misleading context, that is worth reporting.

## What Mavona is not trying to become

Please avoid changes that push Mavona toward:

* a general-purpose coding agent
* a multi-agent orchestrator
* an IDE
* a workflow engine
* a universal repository index
* a framework for every language
* a distributed benchmark platform
* an autonomous infinite-loop coding system

New infrastructure should have a concrete need in the current Rails-specific product.

Do not add abstractions only because they may be useful later.

## Development setup

Clone the repository:

```bash
git clone https://github.com/Doppp/mavona.git
cd mavona
```

Install dependencies:

```bash
mise exec -- bundle install
```

Run the test suite:

```bash
mise exec -- bundle exec rake test
```

Run the CLI from source:

```bash
mise exec -- bundle exec exe/mavona --help
```

## Making a change

Before editing code:

1. understand the existing behavior
2. find the narrowest relevant implementation
3. identify the tests that should fail before the change
4. avoid unrelated refactors
5. preserve existing behavior unless the change explicitly requires otherwise

Prefer small pull requests.

A useful change should usually be understandable without reading a large unrelated diff.

## Rails conventions

Rails conventions are Mavona's default prior.

However, the repository being inspected is the authority.

If a real application deliberately departs from conventional Rails structure, Mavona should learn from that evidence rather than forcing the repository back toward generic Rails assumptions.

When adding support for a Rails pattern, consider both:

* standard Rails behavior
* local application conventions that may override it

## Tests

All behavior changes should include tests where practical.

The normal test suite is for Mavona itself.

Examples include:

* Rails repository detection
* evidence extraction
* CLI behavior
* widening behavior
* verification-state handling
* error and refusal states
* serialization and parsing

Do not rely on real external Rails repositories during the normal unit test suite.

Use small local fixtures where possible.

## Evaluation contributions

Mavona also has a separate evaluation suite for testing whether the harness improves coding-agent performance on real Rails tasks.

This is different from the normal test suite.

Evaluation tasks should be:

* realistic
* small enough to reproduce
* objectively gradable
* based on pinned repository commits
* free from proprietary credentials or services
* useful for comparing the same agent with and without Mavona

Do not add artificial benchmark puzzles simply because they are easy to grade.

The task should resemble real Rails engineering work.

## Hidden graders

Evaluation acceptance graders must remain hidden from the evaluated agent.

The agent must not receive:

* grader source
* grader assertions
* hidden expected outputs
* task-specific acceptance logic beyond the task prompt

This should be enforced structurally.

Do not depend only on prompt instructions asking the agent not to inspect grader files.

Agent-written tests are useful evidence but are not the acceptance oracle.

## Adding an evaluation task

A good evaluation contribution should include:

* repository
* pinned commit
* task prompt
* budget information
* hidden grader
* setup requirements
* expected verification path
* explanation of why the task is useful

Before adding many tasks, prove one task end-to-end.

The preferred loop is:

```text
clean repository state
      ↓
run task
      ↓
agent implementation
      ↓
hidden grader
      ↓
structured result
```

The baseline and Mavona condition should begin from equivalent repository states.

## Verification states

Keep verification states explicit.

Use states such as:

```text
passed
failed
not_run
error
```

Do not collapse them into booleans when doing so loses information.

In particular:

> Not run never means passed.

## Reproducing bugs

A strong bug report includes:

* Rails version
* Ruby version
* relevant repository structure
* exact Mavona command
* expected behavior
* actual behavior
* minimal reproduction, if practical

For agent-behavior reports, also include:

* task prompt
* agent/model
* Mavona output or evidence
* what the agent did
* why the result was wrong or unnecessarily difficult

Avoid sharing private application code unless you are comfortable making it public.

A reduced reproduction is often more useful.

## Pull requests

Keep pull requests focused.

A good PR description should explain:

1. what problem exists
2. how it was reproduced
3. what changed
4. why this is the smallest useful fix
5. how it was verified
6. whether it changes any public behavior

If the change adds a new abstraction or dependency, explain why the existing implementation could not reasonably handle the requirement.

## Dependencies

Mavona should remain lightweight.

Before adding a dependency, consider whether Ruby or Rails already provides what is needed.

New dependencies should have a clear current use and should not be added for hypothetical future functionality.

## Public interfaces

Be conservative when adding:

* CLI commands
* configuration files
* environment variables
* generated files
* public Ruby APIs
* persistent state

Once users depend on an interface, removing it becomes harder.

Prefer internal implementation until there is clear evidence that a public interface is needed.

## Documentation

Documentation should describe behavior that actually exists.

Do not document planned commands or future integrations as though they are already available.

If implementation and documentation disagree, either update both in the same change or explain the discrepancy.

## Style

Follow the existing Ruby style and project conventions.

Prefer:

* clear Ruby
* small methods
* explicit state
* straightforward control flow
* descriptive names

Avoid abstraction for its own sake.

A little duplication is often preferable to introducing an abstraction before the shape of the problem is understood.

## Performance

Do not optimize without evidence.

If a change is motivated by performance, include a reproducible example or benchmark where practical.

Mavona should prioritize correctness and useful evidence selection before micro-optimization.

## Security and privacy

Mavona may inspect real application repositories.

Do not introduce behavior that:

* uploads repository contents unexpectedly
* exposes secrets
* includes environment credentials in generated context
* sends unrelated source code to external services
* logs sensitive values unnecessarily

Repository evidence should remain as narrow as practical for the task.

## Commit and PR scope

Prefer one logical change per pull request.

Avoid combining:

* feature work
* large refactors
* unrelated formatting
* dependency upgrades
* documentation rewrites

unless they are genuinely inseparable.

This makes review and evaluation easier.

## Before submitting

Run the relevant checks.

At minimum:

```bash
mise exec -- bundle exec rake test
```

If your change affects the CLI, exercise the affected command manually.

If your change affects the evaluation framework, run the relevant framework tests and, where practical, one end-to-end evaluation task.

Do not claim that something was verified if it was not run.

## Questions and design changes

If you want to propose a significant change to Mavona's scope or architecture, open an issue or discussion before implementing a large amount of code.

Examples include:

* supporting another programming language
* adding a new agent provider abstraction
* persistent repository indexing
* remote execution
* distributed evaluation
* large configuration surfaces
* changing the evidence model

The question is not whether these ideas are useful in general.

The question is whether Mavona needs them now.

## Guiding principle

When deciding between two implementations, prefer the one that gives a coding agent better Rails-specific evidence with less machinery.

Mavona should earn its complexity.
