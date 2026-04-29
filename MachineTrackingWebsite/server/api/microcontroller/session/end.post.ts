/* 
server/api/microcontroller/session/end.post.ts
Manual session-end endpoint for microcontrollers that manage sessions explicitly.
Finds the single open MachineUsageSession for this device and stamps ended_at.
Returns 404 if no active session exists.
Requires a valid x-api-key header (enforced by microcontroller-auth middleware). 
*/

import prisma from '../../../../server/lib/prisma'

export default defineEventHandler(async (event) => {
  const mc = event.context.microcontroller

  const session = await prisma.machineUsageSession.findFirst({
    where: { microcontroller_id: mc.id, ended_at: null }
  })
  if (!session) throw createError({ statusCode: 404, message: 'No active session' })

  const ended_at = new Date()

  await prisma.machineUsageSession.update({
    where: { id: session.id },
    data: { ended_at }
  })

  return { ok: true }
})