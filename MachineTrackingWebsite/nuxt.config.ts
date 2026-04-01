// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    experimental: { tasks: true },
    // Close sessions open for more than 24 hours, once per hour
    scheduledTasks: {
      '0 * * * *': ['sessions:cleanup'],
    },
  },
  css: ['~/style/main.css'],
  modules: ['nuxt-auth-utils'],
  runtimeConfig: {
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || 'replace-this-in-env-with-32-plus-chars',
      // Keep HTTP local dev working while still enforcing secure cookies in production.
      cookie: {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
})