const Database = require('better-sqlite3')

const db = new Database('./prisma/dev.db')
const rows = db
  .prepare('SELECT email, role, password_hash, created_at FROM "User" ORDER BY created_at DESC LIMIT 20')
  .all()

console.log(rows)
