# Worker

Background job processor for the AI Starter application.

## Usage

### Development Mode (Long-running)

Run the worker in watch mode for development. It will continuously poll for new jobs:

```bash
bun dev
```

### Production Mode (Single Run)

Process all pending jobs and exit. Suitable for cron jobs:

```bash
bun start
```

## Job Types

Currently supported job types:

- `agent`: Execute the GeneralPurposeAgent with workflow instructions

## Architecture

Jobs are stored in the `job` table with the following lifecycle:

1. **pending**: Job created and waiting to be processed
2. **running**: Job claimed by worker and currently executing
3. **completed**: Job finished successfully
4. **failed**: Job execution failed (error stored in result field)

The worker uses a simple single-job-at-a-time processing model for now, with plans to add configurable concurrency in the future.
