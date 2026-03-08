export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch: fetchUserSession } = useUserSession()

  if (!loggedIn.value) {
    await fetchUserSession()
  }

  const currentUser = user.value as { role?: string } | null
  if (loggedIn.value && currentUser?.role === 'admin') {
    const target = typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/')
      ? to.query.redirect
      : '/admin'
    return navigateTo(target)
  }
})
