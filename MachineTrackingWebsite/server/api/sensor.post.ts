import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "prisma/generated/client"

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
})

const prisma = new PrismaClient({ adapter })

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await prisma.sensorData.create({
    data: {
      microcontroller_id: body.microcontrollerId,
      machine_state: body.machineState,
    }
  })

  return { success: true }
})