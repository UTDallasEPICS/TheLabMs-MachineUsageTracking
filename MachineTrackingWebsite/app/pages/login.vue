<script setup lang="ts">
const route = useRoute()
const { loggedIn, user, fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const loading = ref(false)
const forgotLoading = ref(false)
const errorMessage = ref('')
const forgotMessage = ref('')
const devResetUrl = ref('')

const redirectTarget = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/dashboard'
})

watchEffect(() => {
  if (!loggedIn.value) return

  const currentUser = user.value as { role?: string } | null
  if (currentUser?.role === 'admin') {
    navigateTo('/admin')
    return
  }

  navigateTo(redirectTarget.value)
})

async function login() {
  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    await refreshSession()
    await navigateTo(redirectTarget.value)
  } catch {
    errorMessage.value = 'Invalid credentials or account not approved yet.'
  } finally {
    loading.value = false
  }
}

async function sendForgotPassword() {
  if (!email.value.trim()) {
    errorMessage.value = 'Enter your account email first.'
    return
  }

  forgotLoading.value = true
  errorMessage.value = ''
  forgotMessage.value = ''
  devResetUrl.value = ''

  try {
    const result = await $fetch<{ devResetUrl?: string }>('/api/auth/password/forgot', {
      method: 'POST',
      body: { email: email.value.trim().toLowerCase() }
    })

    forgotMessage.value = 'If this is a valid user email, reset instructions were sent.'
    devResetUrl.value = result?.devResetUrl || ''
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    errorMessage.value = message || 'Could not process password reset request.'
  } finally {
    forgotLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="login">
      <h1>User Login</h1>
      <p>Sign in to view machine usage data.</p>

      <label>
        <span>Email</span>
        <input v-model="email" type="email" autocomplete="email" required />
      </label>

      <label>
        <span>Password</span>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
      <p v-if="forgotMessage" class="auth-success">{{ forgotMessage }}</p>
      <a v-if="devResetUrl" class="auth-link auth-link--center" :href="devResetUrl">Open reset link (dev)</a>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </button>

      <button type="button" class="auth-forgot" :disabled="forgotLoading" @click="sendForgotPassword">
        {{ forgotLoading ? 'Sending reset...' : 'Forgot password?' }}
      </button>

      <div class="auth-links">
        <NuxtLink to="/reset-password" class="auth-link">Have a reset token? Reset password</NuxtLink>
        <NuxtLink to="/register" class="auth-link">Need an account? Request signup</NuxtLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.auth-card {
  width: min(500px, 100%);
  display: grid;
  gap: 1rem;
  border: 1px solid rgba(128, 176, 224, 0.26);
  border-radius: 14px;
  background: var(--surface-elevated);
  padding: 1.4rem;
  box-shadow: 0 16px 38px rgba(3, 9, 17, 0.34);
}

.auth-card h1,
.auth-card p {
  margin: 0;
}

.auth-card label {
  display: grid;
  gap: 0.3rem;
}

.auth-card input {
  border: 1px solid rgba(128, 176, 224, 0.28);
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  background: rgba(8, 23, 40, 0.9);
  color: var(--text-primary);
}

.auth-card input:focus {
  outline: none;
  border-color: rgba(128, 176, 224, 0.6);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.auth-card button {
  border: 1px solid rgba(128, 176, 224, 0.35);
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  background: linear-gradient(145deg, rgba(128, 176, 224, 0.85), rgba(224, 16, 64, 0.72));
  color: var(--text-primary);
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s ease, box-shadow 0.2s ease;
}

.auth-card button:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: 0 8px 20px rgba(128, 176, 224, 0.25);
}

.auth-card button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-error {
  color: var(--secondary-color);
}

.auth-success {
  color: var(--primary-hover);
}

.auth-forgot {
  border: 1px solid rgba(128, 176, 224, 0.35);
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  background: transparent;
  color: var(--primary-color);
  font-weight: 600;
  cursor: pointer;
}

.auth-forgot:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-link {
  color: var(--text-secondary);
  font-size: 0.86rem;
  text-decoration: none;
  text-align: center;
  transition: color 0.2s ease;
}

.auth-link:hover {
  color: var(--text-primary);
}

.auth-links {
  display: grid;
  gap: 0.25rem;
}
</style>
