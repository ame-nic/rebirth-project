# Migrations Log

Chronological log of every storage migration applied to the data model.

## How to add a migration

1. Open `src/shared/storage/migrationRunner.js`.
2. Append a new entry with a strictly increasing numeric `id` — never
   reuse an id, never edit a migration that has already shipped.
3. Update `docs/DATA_MODEL.md` to reflect the new shape.
4. Add a row to the table below.
5. If the original prompt that defined the type is archived in
   `prompts/`, add a `// Migrazione #N: …` note next to the old shape.
6. If the architecture surface changed (a new container, a new
   endpoint), update the matching `.drawio` in `docs/diagrams/`.

Migrations are **silent** for the user. See `CLAUDE.md` → Regola 3.

---

## Migrations executed

| ID  | Date       | Keys affected                                  | Description                                                                                                                                                                            | Prompt updated |
|-----|------------|------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------|
| 0   | 2026-05-17 | —                                              | Migration system smoke test — no-op marker that proves the runner ran.                                                                                                                | n/a            |
| 1   | 2026-05-17 | `rebirth_health_snapshots`, `rebirth_hrv_baseline` | Remove Apple Health bridge. Wipes both keys from localStorage and Upstash. Readiness + AI Expert Assessment now consume only manually-entered data (check-in, body measurements, habits, training log). | n/a            |
| 2   | 2026-05-17 | `rebirth_alter_ego`, `rebirth_weekly_ai_message` (local-only) | Remove alter ego feature. Deletes `rebirth_alter_ego` locally + on Upstash, and drops the local-only weekly AI message cache.                                                                            | n/a            |

---

## Planned migrations

None.

---

## Notes

- Migrations run sequentially at app bootstrap before the first render.
- A failed migration is logged and skipped — boot is never blocked.
- Executed ids live in `localStorage._migrations_executed` and are
  device-local. Each device runs its own catch-up the first time it
  boots a release.
- Idempotency is mandatory. A migration that runs twice on the same
  device must be a no-op the second time.
- Breaking shape changes should use a versioned key
  (`foo_v5` → `foo_v6`) so old code can still read the old data until
  the migration has run.
