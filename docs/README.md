# rebirth-project — docs

PWA personale, Italian-language, deployed on Vercel.
This folder contains everything beyond the source itself: architecture
decisions, data model, API reference, deployment runbook, and the
diagrams that capture how the pieces fit together.

## Index

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architectural decisions + ADRs
- [`DATA_MODEL.md`](./DATA_MODEL.md) — storage keys and their TypeScript-style schemas
- [`MIGRATIONS.md`](./MIGRATIONS.md) — migration log + how to add one
- [`FEATURES.md`](./FEATURES.md) — feature catalogue, layer by layer
- [`API.md`](./API.md) — Edge Function reference (`/api/ai`, `/api/storage`)
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Vercel + Upstash provisioning
- [`diagrams/`](./diagrams) — draw.io files (capability map, C4, architecture overview)

## How to keep this honest

Per `CLAUDE.md` at the repo root, whenever architecture or schema
changes, the diagrams and the matching doc here must be updated in the
same commit as the code. Stale docs are worse than missing ones.
