/*
  server/api/admin/logout.post.ts
  Clears the current user session cookie, logging out the admin.
  No authentication check is needed — clearing an already-absent session is harmless.
*/
export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { ok: true }
})
