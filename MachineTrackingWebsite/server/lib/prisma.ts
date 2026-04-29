/* 
server/lib/prisma.ts
Shared Prisma client singleton used by every server-side API route and utility.
Importing from this file instead of constructing a new PrismaClient each time
prevents connection pool exhaustion during hot-reload in development.
*/

import { PrismaClient } from '../../generated/prisma/client.ts'

const prisma = new PrismaClient()
export default prisma