/* 
server/api/auth/me.get.ts
Returns the current session state for the frontend.
Used by nuxt-auth-utils useUserSession() to hydrate loggedIn and user on the client.
Returns { loggedIn: boolean, user: SessionUser | null }. 
*/

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  return {
    loggedIn: Boolean(session.user),
    user: session.user ?? null
  }
})
