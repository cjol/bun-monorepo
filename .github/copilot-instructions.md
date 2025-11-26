# Copilot Instructions for ai-starter

## Commands

- `bun test` - Run all tests
- `bun test path/to/file.test.ts` - Run a single test file
- `bun test -t "test name pattern"` - Run tests matching name pattern
- `bun test --coverage` - Run tests with coverage report
- `bun run typecheck` - Type-check all packages
- `bun run lint` - Check code style with ESLint and Prettier
- `bun lint:fix` - Auto-fix linting issues and format code
- `bun check` - Run all checks (tests, typecheck, lint)

## Development Workflow

- For ALL new pieces of work, always create a new branch first.
- Before you write any new code, think carefully about the code architecture.
- Always follow test-driven-development with a red-green-refactor cycle.
- Commit often with small, atomic changes.
- Always format your code with `bun lint:fix` before committing.
- Before stopping work, always make sure `bun check` passes.
- When you have finished work and `bun check` passes, you MUST ALWAYS open a new PR.
- After creating a PR, you should always wait for the CI status checks to be reported. Once they are reported as passing, you can stop working. If they fail to pass, you should always try to fix the failures (follow the normal development cycle for this, with small, focussed commits).
- Never output summaries or reports to a file unless asked to. You can report to me in your responses, but it's unhelpful to include those transient details in the codebase.

## Code Style

**Types & Functions:**

- Always use explicit types. Never use `any` -- use generic types or `unknown` if necessary.
- Don't annotate function return types -- rely on type inference.
- Prefer stateless functions over classes.
- Prefix unused variables with underscore (e.g., `_unusedParam`).

**Imports:**

- Use `type` imports for type-only imports: `import type { Foo } from "bar";`
- Group imports: external packages first, then internal packages (e.g., `@ai-starter/*`), then relative imports.

**Dependency Injection:**

- Use curried "XXXDeps" parameter pattern:
  ```ts
  export interface GetFooDeps {
    repo: FooRepository;
  }
  export function getFoo(deps: GetFooDeps) {
    return async function (props: GetFooProps) {
      return deps.repo.getFooById(props.id);
    };
  }
  ```

**File Organization:**

- Keep only one meaningful export per file. Co-locate tightly-coupled type definitions.
- Co-locate tests with code (`.test.ts` alongside `.ts`). Only e2e tests go in root `tests/` folder.

**Architecture:**

- Follow hexagonal architecture with strict dependency direction:
  - `packages/core`: Domain models and interfaces. No external dependencies.
  - `packages/app`: Application services. Depends on `core` only.
  - `packages/db`, apps in `apps/*`: Adapters. Depend on `core` and `app` but not on each other.

**Error Handling:**

- Use `@hapi/boom` for HTTP errors (e.g., `notFound()`, `badImplementation()`).

**Testing:**

- Use common test utilities from `@ai-starter/db/test-utils` for consistency.
- Review coverage with `bun test --coverage` but don't stress about 100% coverage.
- You should never manually create one-off mocks in tests. Always add reusable mocks in the test-utils/seed package.

**Data Storage:**

- When properties are automatically created by the database (e.g., `id`, `createdAt`, `updatedAt`), you should never specify them manually when creating new records. Always let the database handle them.
