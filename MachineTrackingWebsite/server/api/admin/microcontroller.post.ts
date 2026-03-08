import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

function generateApiKey(length = 64): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * alphabet.length)
    return alphabet[index]
  }).join('')
}

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const { name } = await readBody(event)

  const mc = await prisma.microcontroller.create({
    data: {
      name,
      api_key: generateApiKey()
    }
  })

  // Return the key once — store it somewhere safe, you can't retrieve it again
  return { id: mc.id, name: mc.name, api_key: mc.api_key }
})