# Supabase migrations

Apply all migrations in numerical order via:

1. Supabase Dashboard → SQL Editor → paste contents of each `migrations/*.sql` → Run.
2. OR run `npm run db:apply` (uses `scripts/apply-migration.js` — to be added).

Never edit a migration that has been applied. Always create a new numbered file.
