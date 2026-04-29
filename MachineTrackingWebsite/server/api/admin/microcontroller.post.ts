/*
  server/api/admin/microcontroller.post.ts
  Registers a new microcontroller device with a name and an API key.
  If no apiKey is supplied in the request body a random 16-character alphanumeric
  key is generated automatically. Validates that the key is alphanumeric and unique.
  Returns the created record including the plain-text key so it can be copied once.
  Requires admin session.
*/
import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

function generateApiKey(length = 16): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * alphabet.length)
    return alphabet[index]
  }).join('')
}

type CreateMicrocontrollerBody = {
  name?: string
  apiKey?: string
}

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const body = await readBody<CreateMicrocontrollerBody>(event)
  const name = body.name?.trim()
  const providedKey = body.apiKey?.trim()

  if (!name) {
    throw createError({ statusCode: 400, message: 'Microcontroller name is required' })
  }

  const apiKey = providedKey || generateApiKey(16)

  if (!apiKey.length) {
    throw createError({ statusCode: 400, message: 'API key cannot be empty' })
  }

  if (!/^[A-Za-z0-9]+$/.test(apiKey)) {
    throw createError({ statusCode: 400, message: 'API key can only contain letters and numbers' })
  }

  const existing = await prisma.microcontroller.findUnique({ where: { api_key: apiKey }, select: { id: true } })
  if (existing) {
    throw createError({ statusCode: 409, message: 'API key already exists. Choose another one.' })
  }

  const mc = await prisma.microcontroller.create({
    data: {
      name,
      api_key: apiKey
    }
  })

  return { id: mc.id, name: mc.name, api_key: mc.api_key }
})