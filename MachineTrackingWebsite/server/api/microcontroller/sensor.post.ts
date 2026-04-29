/* 
server/api/microcontroller/sensor.post.ts
Primary data-ingestion endpoint called by physical microcontrollers.
Accepts a machine_state signal (boolean / 0-1 / on-off string) and writes a
SensorData row. Within the same transaction it auto-manages MachineUsageSession:
a TRUE signal opens a new session (if none is already open), a FALSE signal
closes all open sessions for this device. The isAC value is copied from the
Microcontroller record so each raw reading carries the current AC/DC mode.
Requires a valid x-api-key header (enforced by microcontroller-auth middleware). 
*/

import prisma from '../../../server/lib/prisma'

function parseMachineState(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (value === 1) return true
    if (value === 0) return false
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'on', 'high', 'start', 'started'].includes(normalized)) return true
    if (['0', 'false', 'off', 'low', 'stop', 'stopped'].includes(normalized)) return false
  }

  return null
}

export default defineEventHandler(async (event) => {
  const mc = event.context.microcontroller
  const body = await readBody(event)
  const rawState =
    body?.machine_state ??
    body?.machineState ??
    body?.state ??
    body?.value ??
    body?.status
  const machineState = parseMachineState(rawState)

  if (machineState === null) {
    throw createError({
      statusCode: 400,
      message: 'Invalid machine state. Provide machine_state as boolean, 0/1, or on/off.',
    })
  }
  const timestamp = new Date()

  return await prisma.$transaction(async (tx) => {
    const data = await tx.sensorData.create({
      data: {
        microcontroller_id: mc.id,
        machine_state: machineState,
        timestamp,
        isAC: mc.isAC,
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