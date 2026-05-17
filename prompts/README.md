# prompts/

Archive of the Claude Code prompts that built this project, in the
order they were applied. Each prompt is the canonical source for the
shape and intent of a feature — when the schema changes, the
matching prompt here gets an inline `// Migrazione #N: …` note next
to the old definition.

## Layout

```
prompts/
  README.md
  00-init.md                 — CLAUDE.md spec + project bible
  01-phase-1-pwa-refactor.md
  02-exercise-variants.md
  03-daily-feed.md
  04-production-hardening.md
  05-smart-recipe-engine.md
  06-ai-edge-function.md
  07-layer-1-atomic-habits.md
  08-layer-10-apple-health-bridge.md
  09-layer-4-readiness.md
  10-layer-5-body-measurements.md
  11-layer-6-professional-growth.md
  12-layer-9-alter-ego.md
  13-storage-upstash-migration.md
  14-documentation-and-diagrams.md  ← this layer
```

## How to add a prompt

1. Drop the original Claude Code prompt as a markdown file with the
   next sequential number.
2. If the prompt defines a new persisted shape, mirror it into
   `docs/DATA_MODEL.md`.
3. When the shape later changes via a migration, edit the original
   prompt here to flag the change:

```diff
 type Habit = {
   id:        string;
   name:      string;
-  emoji:     string;
+  emoji?:    string;  // Migrazione #3: now optional
   ...
 };
```

Keeping these files is the only way the prompts stay an accurate
record of *why* the schema looks the way it does.
