# ai-starter

## Code Style

- Always use explicit types. Never use `any` -- we can cope with the complexity
  of generic types or `unknown` if necessary.
- In general, prefer stateless functions over classes.
- For dependency injection, use a curried "XXXDeps" parameter pattern:

  ```ts
  export interface GetFooDeps {
    repo: FooRepository;
  }

  export interface GetFooProps {
    id: string;
  }

  export function getFoo(deps: GetFooDeps) {
    return async function (id: GetFooProps) {
      const foo = await deps.repo.getFooById(id);
      return foo;
    };
  }
  ```

- Try to keep only one meaningful export per file. Type definitions are fine if
  they are _very_ tightly coupled to the implementation, but otherwise consider
  whether a new separate model definition is required.
- It's not normally useful to annotate the return type of a function. Type
  inference is fine.
- Always follow test-driven-development with a red-green-refactor cycle.
- As far as possible, co-locate tests with the code they are testing. Only e2e
  tests should go in a separate `tests/` folder at the root of the monorepo.
- Don't stress out about code coverage, but do review it with
  `bun test --coverage` to check there aren't any obvious blind spots.
- Code is laid out according to a hexagonal architecture with strict dependency
  direction rules:
  - Core domain models and interfaces in `packages/core` must not depend on
    anything else.
  - Application services in `packages/application` can depend on `core` but not
    on any adapters.
  - Adapters in `packages/db`, `packages/ai-sdk`, `packages/ses`, and apps in
    `apps/api`, `apps/cli`, `apps/web`, `apps/email-listener` can depend on
    `core` and `application` but not on each other (they should be
    self-contained).
- All tests should use common test utilities so that they are structured in a
  consistent way and easy to read.

## Development Workflow

- Whenever you start a new piece of work, always create a new branch off `main`
  first.
- Before you write any new code, think carefully about the code architecture.
- Commit often with small, atomic changes.
- Always format your code with `bun lint:fix` before committing
- Before stopping work, always make sure `bun check` passes.
- When you have finished work and `bun check` passes, you can open a new PR.
- After creating a PR, you should always wait for the CI status checks to be
  reported. Once they are reported as passing, you can stop working. If they
  fail to pass, you should always try to fix the failures (follow the normal
  development cycle for this, with small, focussed commits).
- Never output summaries or reports to a file unless asked to. You can report to
  me in your responses, but it's unhelpful to include those transient details in
  the codebase.

## Project Structure

The code structure is broadly organised according to a hexagonal architecture.
This is not definitive or exhaustive. Many of the files suggested below will not
actually need to be created. But if they do, here's where you should put them:

```
/ai-starter
│
├── apps
│   │
│   ├── api                 # Elysia API (Adapter)
│   │   ├── infra           # Pulumi for API
│   │   │   └── main.ts
│   │   ├── src
│   │   │   ├── endpoints   # Elysia route definitions
│   │   │   │   ├── foo.ts
│   │   │   ├── index.ts    # Main Elysia server entrypoint
│   │   │   └── context.ts  # DI setup
│   │   └── package.json
│   │
│   ├── cli                 # CLI (Adapter)
│   │   ├── infra           # Pulumi for CLI
│   │   │   └── main.ts
│   │   ├── src
│   │   │   ├── commands    # CLI command files
│   │   │   │   └── run.ts
│   │   │   └── index.ts    # Main CLI entrypoint
│   │   └── package.json
│   │
│   └── web                 # Next.js Frontend (Adapter)
│       ├── infra           # Pulumi for web-hosting
│       │   └── main.ts
│       ├── app             # Next.js app router
│       │   └── (routes)
│       ├── lib
│       │   └── eden.ts     # Eden setup for type-safe API client
│       └── package.json
│
├── infra                   # Top-level common infra (VPC, Domains, IAM)
│   └── main.ts
│
├── packages
│   │
│   ├── core                # THE HEXAGON (Core Domain)
│   │   ├── domain          # Core domain models/classes
│   │   │   ├── bar.ts
│   │   │   └── index.ts
│   │   ├── ports           # Interfaces
│   │   │   ├── repositories
│   │   │   │   ├── FooRepository.ts
│   │   │   │   └── index.ts
│   │   │   ├── ai
│   │   │   │   ├── AgentModel.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── schema          # Drizzle schema
│   │   │   ├── foo.ts
│   │   │   └── index.ts
│   │   ├── validation      # Zod validation schemas
│   │   │   ├── foo.ts
│   │   │   └── index.ts
│   │   ├── index.ts        # Barrel file
│   │   └── package.json
│   │
│   ├── application         # APPLICATION LAYER
│   │   ├── agent           # Agent-related orchestration
│   │   │   ├── AgentService.ts
│   │   │   ├── tools
│   │   │   │   ├── codeSandbox.ts
│   │   │   │   └── index.ts
│   │   │   ├── rag
│   │   │   │   ├── retrieveWorkflows.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── core            # Core business logic orchestration
│   │   │   ├── CoreAppService.ts
│   │   │   ├── use-cases
│   │   │   │   ├── getFoos.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── index.ts        # Barrel file
│   │   └── package.json
│   │
│   ├── ai-sdk              # Driven Adapter (LLM Abstraction)
│   │   ├── AgentModel.ts   # Implements IAgentModel
│   │   ├── client.ts       # Low-level client (e.g., Anthropic)
│   │   ├── index.ts
│   │   └── package.json
│   │
│   └── db                  # Driven Adapter (Database)
│      ├── repositories
│      │   ├── DrizzleFooRepository.ts
│      │   └── index.ts
│      ├── client.ts       # Drizzle client setup
│      ├── index.ts
│      └── package.json
│
│
├── bun.lockb               # Bun lockfile
├── package.json            # Root package.json (defines bun workspace)
└── tsconfig.base.json      # Shared base TS config for the monorepo
```
