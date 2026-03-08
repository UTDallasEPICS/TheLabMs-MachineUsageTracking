export default defineNuxtRouteMiddleware(async (to) => {
	const { loggedIn, user, fetch: fetchUserSession } = useUserSession()

	if (!loggedIn.value) {
		await fetchUserSession()
	}

	const currentUser = user.value as { role?: string } | null

	if (!loggedIn.value) {
		const redirect = encodeURIComponent(to.fullPath)
		return navigateTo(`/admin/login?redirect=${redirect}`)
	}

	if (currentUser?.role !== 'admin') {
		return navigateTo('/')
	}
})
