# ai-starter

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
- You should never manually create one-off mocks in tests. Always add reusable mocks in the test-utils/seed package. (TODO: this needs to be fixed in legacy code)

**Data Storage**

- When properties are automatically created by the database (e.g., `id`, `createdAt`, `updatedAt`), you should never specify them manually when creating new records. Always let the database handle them. (TODO: this needs to be fixed in legacy code)

## Current focus

Right now, we're working on a broad extension to the codebase to include the following data structures:

We're going to start a big piece of work and I'm going to leave you running at it for a while indepenently. Use a new subagent for each step. Make _short_ (max 3 lines for each step) notes on progress in a new PROGRESS.md file so that new agents share context. Keep the todo list in @AGENTS.md up-to-date as you make progress.

We're working on a broad extension to the codebase to include key functionality from a hackathon project. If you need to refer back to that project, you can find it in the @old-v2 folder. We _do not_ need backwards-compatibility and for all sorts of reasons we don't want to copy and paste code from there.
The only thing we are carrying forward from V2 are some of the core ideas.

### Things to reimplement from V2:

- basic matter/bill/time entry structures
- email sending

### Things to change:

- the "patch" logic for changing time entries. Just simplify with a log of
  before/after changes. Extend with an explicit system of "suggestions" stored
  separately to approve AI edits
- the pre-generated workflow and templates. Too inflexible quite quickly.
  Replace with a general purpose agent (a bit like the current ad-hoc analysis
  agent) which generates and executes code immediately instead of persisting it
  for later re-use
- Also replace the structured workflow/templates with unstructured (free-text,
  natural language) workflows which can be used as context for agent prompts
- PLan for multiple clients from the start. V2 was CLI first with some API
  endpoints bolted on later. V3 will need CLI (non-interactive), API and email
  interfaces from the start

## TODO List:

- [x] Define the core matter schema in packages/db/schema/.
- [x] Define the core bill schema in packages/db/schema/.
- [x] Define the core timeEntry schema in packages/db/schema/.
- [x] Add a timeEntryChangeLog table to packages/db/schema/ to log before/after JSON blobs for time entry mutations.
- [x] Create an aiSuggestion table in packages/db/schema/, linking to timeEntry and message, with a status field (pending, approved, rejected).
- [x] Create a new workflows table in packages/db/schema/ to store unstructured, natural-language instructions as text.
- [x] Add an approveSuggestion method to the SuggestionService that applies the change to the associated timeEntry and updates the suggestion's status.
- [x] Ensure the approveSuggestion method also creates a new record in the timeEntryChangeLog table with the 'before' and 'after' data.
- [x] Add a rejectSuggestion method to the SuggestionService to update an aiSuggestion record's status to 'rejected'.
- [x] Create a TimeEntryService in packages/core/src/services/ for handling manual (non-suggestion) creation and updates of time entries.
- [x] Ensure all methods in TimeEntryService that modify an entry also create a corresponding record in the timeEntryChangeLog.
- [x] Create a MatterService for handling CRUD (Create, Read, Update, Delete) operations for matters.
- [x] Create a BillService for handling CRUD operations for bills.
- [x] Create a WorkflowService for handling CRUD operations for the new unstructured, natural language workflows.
- [ ] Build a new GeneralPurposeAgent (reference the current dataAnalysisAgent which will be quite similar) in packages/ai/agents/ with access to appropriate functions to manipulate matters, bills, time entries and workflows.
- [ ] Include workflow context in the agent's prompt when executing tasks.
- [ ] Build out the primary REST/RPC endpoints in apps/api/ using the new core services.
- [ ] Create an EmailIngestionService (e.g., via webhook) that parses inbound emails and creates new Conversation and Message records.
- [ ] Create an EmailSendingService that agents can call via a tool, which sends a Message as an outbound email.
