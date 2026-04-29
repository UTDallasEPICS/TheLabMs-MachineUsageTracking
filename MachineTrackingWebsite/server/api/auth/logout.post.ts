/* 
server/api/auth/logout.post.ts
Clears the current user session cookie, logging out the regular user. 
*/

export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { ok: true }
})
