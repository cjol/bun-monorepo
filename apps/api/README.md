# API

REST API built with Elysia that exposes the core application functionality.

## Running

```bash
bun run apps/api/src/index.ts
```

## Endpoints

- `GET /foos/:id` - Get a foo by ID
- `POST /foos` - Create a new foo
- `PATCH /foos/:id` - Update a foo's name
