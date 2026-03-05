import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type ColumnInfo = {
  name: string
  type: string
}

type TableInfo = {
  name: string
  columns: ColumnInfo[]
}


// Gets the list of tables and their columns from the Prisma migration SQL file
function parseTables(sql: string): TableInfo[] {
  const tables: TableInfo[] = []
  const tableRegex = /CREATE TABLE\s+"([^"]+)"\s*\(([^;]*?)\);/gms

  for (const match of sql.matchAll(tableRegex)) {
    const tableName = match[1]!
    const tableBody = match[2]!

    const columns = tableBody
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('"') && !line.startsWith('CONSTRAINT'))
      .map((line) => line.replace(/,$/, ''))
      .map((line) => {
        const columnMatch = line.match(/^"([^"]+)"\s+(.+)$/)
        return {
          name: columnMatch?.[1] ?? 'unknown',
          type: columnMatch?.[2] ?? 'unknown',
        }
      })

    tables.push({
      name: tableName,
      columns,
    })
  }

  return tables
}

// API endpoint to return the list of tables and their columns from the Prisma migration SQL file
// It does all of the http stuff for us. We just need to return the data we want to send back to the client.
export default defineEventHandler(async () => {
  const migrationsRoot = resolve(process.cwd(), 'prisma/migrations')
  const entries = await readdir(migrationsRoot, { withFileTypes: true })
  const migrationDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const latestMigrationDir = migrationDirs.at(-1)

  if (!latestMigrationDir) {
    return {
      source: null,
      count: 0,
      tables: [],
    }
  }

  const relativeSource = `prisma/migrations/${latestMigrationDir}/migration.sql`
  const migrationPath = resolve(process.cwd(), relativeSource)

  const sql = await readFile(migrationPath, 'utf8')
  const tables = parseTables(sql)

  return {
    source: relativeSource,
    count: tables.length,
    tables,
  }
})
