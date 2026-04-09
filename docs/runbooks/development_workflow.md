# AgentTwin Development Workflow

## Startup Sequence

1. Copy `.env.example` to `.env`.
2. Run `npm install` in `modules/AgentTwin`.
3. Start the API with `npm run dev:api`.
4. Start the admin shell with `npm run dev:admin`.
5. Start the worker with `npm run dev:worker`.

## Development Persistence

- Runtime chat traces and audit events are persisted to `AGENTTWIN_DATA_DIR/runtime-store.json`.
- Mutable FAQ entries, knowledge articles, and risk rules are persisted to `AGENTTWIN_DATA_DIR/knowledge-catalog.json`.
- Tenant and group trigger configuration are persisted to `AGENTTWIN_DATA_DIR/routing-config.json`.
- The same service layer can now run on PostgreSQL-backed repositories when `AGENTTWIN_STORAGE_MODE=postgres` and `DATABASE_URL` are configured.
- File-backed JSON remains the default local-development mode.

## PostgreSQL Bootstrap

- Set `DATABASE_URL` to the target PostgreSQL instance.
- Set `AGENTTWIN_STORAGE_MODE=postgres` to activate PostgreSQL-backed repositories.
- Run `npm run db:bootstrap` from `modules/AgentTwin`.
- This applies `infra/sql/001_init.sql`, `infra/sql/002_seed_demo.sql`, and `infra/sql/003_agenttwin_state.sql`.
- Check `/api/admin/storage` to confirm the selected backend mode and connectivity status.

## Development Logging Rules

- Every meaningful development milestone must be appended to `docs/dev-logs/agenttwin_development_log.md`.
- A meaningful milestone includes delivered files, a verified command run, or an architectural decision that affects later work.
- If the active development log exceeds 500 lines, rotate it with `npm run log:rotate`.
- Archived logs are written to `docs/dev-logs/archive/`.

## Handover Rules

- Update `docs/handover/agenttwin_handover.md` when scope, status, startup commands, or critical risks change.
- Treat the handover file as the first-read document for the next AI or engineer.
- The handover file must stay concise and current; deep detail belongs in specs, plans, or logs.

## Verification Workflow

- Run `npm run build`.
- Run `npm run test`.
- Record the exact commands and results in the development log.

## Near-Term Implementation Order

1. WeCom callback transport
2. chat engine contract
3. FAQ and RAG integration
4. admin operations surface
5. migration and tenant tooling
