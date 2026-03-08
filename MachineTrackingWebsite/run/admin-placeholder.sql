-- Placeholder admin upsert for SQLite.
-- Edit these values as needed before running:
--   email: kherod.vidal@gmail.com
--   password_hash: bcrypt hash for plain password Admin123!
--
-- Execute with Prisma:
-- pnpm prisma db execute --file run/admin-placeholder.sql --schema prisma/schema.prisma

INSERT INTO "User" ("id", "email", "password_hash", "role")
VALUES (
  lower(hex(randomblob(16))),
  'kherod.vidal@gmail.com',
  '$2b$10$IV8/4SBUa5DR8KrixRdeNeNKwvNqOv5zXIBjQl3Vxao35NCRQToRq',
  'admin'
)
ON CONFLICT("email") DO UPDATE SET
  "password_hash" = excluded."password_hash",
  "role" = 'admin';

-- Optional: remove matching pending signup so this account is immediately active.
DELETE FROM "PendingUser" WHERE "email" = 'kherod.vidal@gmail.com';

-- Verify
SELECT "id", "email", "role", "created_at" FROM "User" WHERE "email" = 'kherod.vidal@gmail.com';
