# Tareeq Agent Instructions

Before changing code, read and follow [CODING_STYLE.md](./CODING_STYLE.md). It is
the canonical engineering and workflow guide for this repository.

Additional rules for coding agents:

- Inspect current code and tests before relying on historical documentation.
- Preserve all existing dirty-worktree changes unless the user explicitly asks
  you to modify them.
- Keep edits scoped to the requested app and behavior.
- Run commands from `apps/consumer` or `apps/admin`, as appropriate.
- Never reveal secrets or move server credentials into browser code.
- Never commit, push, deploy, restart AWS services, or mutate live data without
  explicit user approval for that action.
- Report exactly which checks were run and whether the result was committed,
  pushed, or deployed.

The app-level `AGENTS.md` files are historical context. If they conflict with
the current repository or `CODING_STYLE.md`, the root guide takes precedence.
