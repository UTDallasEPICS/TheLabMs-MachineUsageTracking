import { hash } from 'bcrypt-ts'
import prisma from '../lib/prisma'

const adminEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineNitroPlugin(async () => {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.ADMIN_PASSWORD ?? ''

    if (!email || !password) {
        console.warn('[init-admin] Missing admin email or password; skipping admin bootstrap.')
        return
    }

    if (!adminEmailPattern.test(email)) {
        console.warn(`[init-admin] Invalid admin email skipped: ${email}`)
        return
    }

    const passwordHash = await hash(password, 10)

    await prisma.$transaction([
        prisma.session.deleteMany({
            where: {
                user: {
                    role: 'admin',
                    email: { not: email }
                }
            }
        }),
        prisma.user.deleteMany({
            where: {
                role: 'admin',
                email: { not: email }
            }
        }),
        prisma.user.upsert({
            where: { email },
            update: {
                password_hash: passwordHash,
                role: 'admin'
            },
            create: {
                email,
                password_hash: passwordHash,
                role: 'admin'
            }
        })
    ])

    console.log(`[init-admin] Admin account prepared for ${email}`)
})