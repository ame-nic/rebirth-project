/* Lazy migrations — field-level defaults applied when a record is read.

   Cheap renames, missing-field defaults, and additive changes belong
   here rather than in the sequential runner: they're invisible, never
   "fail," and they don't require bookkeeping. Use this for changes
   that an old record can survive without any work.

   For structural changes (reshape, breaking rename, type flip) use
   migrationRunner.js instead. */

export function withDefaults(record, defaults) {
  if (record == null) return record;
  return { ...defaults, ...record };
}

export function arrayWithDefaults(list, defaults) {
  if (!Array.isArray(list)) return list;
  return list.map((row) => withDefaults(row, defaults));
}
