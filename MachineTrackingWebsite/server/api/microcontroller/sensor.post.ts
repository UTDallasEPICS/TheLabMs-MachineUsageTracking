import prisma from '../../../server/lib/prisma'

export default defineEventHandler(async (event) => {
  const mc = event.context.microcontroller
  const { machine_state } = await readBody(event)

  // DEBUG: log incoming signal
  console.log(`[DEBUG] Signal received from microcontroller "${mc.name ?? mc.id}": ${machine_state ? 'ON' : 'OFF'}`)

  const data = await prisma.sensorData.create({
    data: {
      microcontroller_id: mc.id,
      machine_state
    }
  })

  return { ok: true, id: data.id }
})