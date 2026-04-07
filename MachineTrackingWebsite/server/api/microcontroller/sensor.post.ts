import prisma from '../../../server/lib/prisma'

export default defineEventHandler(async (event) => {
  const mc = event.context.microcontroller
  const body = await readBody(event)
  const machineState = body?.machine_state

  if (typeof machineState !== 'boolean') {
    throw createError({ statusCode: 400, message: 'machine_state must be a boolean value' })
  }
  const timestamp = new Date()

  return await prisma.$transaction(async (tx) => {
    const data = await tx.sensorData.create({
      data: {
        microcontroller_id: mc.id,
        machine_state: machineState,
        timestamp,
      },
    })

    if (machineState) {
      const openSession = await tx.machineUsageSession.findFirst({
        where: {
          microcontroller_id: mc.id,
          ended_at: null,
        },
        select: { id: true },
      })

      if (!openSession) {
        await tx.machineUsageSession.create({
          data: {
            microcontroller_id: mc.id,
            started_at: timestamp,
          },
        })
      }
    } else {
      await tx.machineUsageSession.updateMany({
        where: {
          microcontroller_id: mc.id,
          ended_at: null,
        },
        data: { ended_at: timestamp },
      })
    }

    return { ok: true, id: data.id }
  })
})