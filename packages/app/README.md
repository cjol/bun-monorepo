# App Module

This package contains the main application logic, including service layers. It
does not contain any port adapters, which are located in their own packages
(e.g., `db` for database access, `ai-sdk` for LLM access). It also does not
contain deployable units; those are located in the top-level `apps/` folder.
