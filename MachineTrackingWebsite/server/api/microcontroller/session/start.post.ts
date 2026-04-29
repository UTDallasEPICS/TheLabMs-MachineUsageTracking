/* 
server/api/microcontroller/session/start.post.ts
Manual session-start endpoint for microcontrollers that manage sessions
explicitly rather than via the sensor.post signal.
Closes any currently open session for this device before creating a new one,
ensuring only one active session exists at a time.
Requires a valid x-api-key header (enforced by microcontroller-auth middleware). 
*/

import prisma from '../../../../server/lib/prisma'

export default defineEventHandler(async (event) => {
  const mc = event.context.microcontroller

  // Close any existing open session first
  await prisma.machineUsageSession.updateMany({
    where: { microcontroller_id: mc.id, ended_at: null },
    data: { ended_at: new Date() }
  })

  const session = await prisma.machineUsageSession.create({
    data: {
      microcontroller_id: mc.id,
      started_at: new Date()
    }
  })

  return { ok: true, session_id: session.id }
})