# Core Module

This package defines core data types and models. It should have no dependencies
on the rest of our code (or indeed on anything other than basic schema-building
tools like zod and drizzle).

It can contain simple business logic (e.g. zod validation).

Currently there's no testing set up here because there's no logic to test; just
schema definitions.
