-- Fix: Postgres has no 'base64url' encoding. Use 'hex' for the magic_token default.
ALTER TABLE prospects
  ALTER COLUMN magic_token
  SET DEFAULT encode(gen_random_bytes(24), 'hex');
