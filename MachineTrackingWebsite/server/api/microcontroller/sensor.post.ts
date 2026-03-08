import prisma from '../../../server/lib/prisma'

export default defineEventHandler(async (event) => {
  const mc = event.context.microcontroller
  const { machine_state } = await readBody(event)

  const data = await prisma.sensorData.create({
    data: {
      microcontroller_id: mc.id,
      machine_state
    }
  })

  return { ok: true, id: data.id }
})