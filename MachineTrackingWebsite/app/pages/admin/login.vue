<script setup lang="ts">
definePageMeta({ middleware: 'admin-login' })

const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const forgotLoading = ref(false)
const errorMessage = ref('')
const forgotMessage = ref('')
const devResetUrl = ref('')

const redirectTarget = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/admin'
})

async function loginAsAdmin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Email and password are required.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    // Force full-page navigation so cookie/session state is guaranteed on the next route.
    window.location.assign(redirectTarget.value)
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    errorMessage.value = message || 'Invalid admin credentials.'
  } finally {
    loading.value = false
  }
}

async function sendForgotPassword() {
  if (!email.value.trim()) {
    errorMessage.value = 'Enter your admin email first.'
    return
  }

  forgotLoading.value = true
  errorMessage.value = ''
  forgotMessage.value = ''
  devResetUrl.value = ''

  try {
    const result = await $fetch<{ devResetUrl?: string }>('/api/admin/password/forgot', {
      method: 'POST',
      body: { email: email.value.trim().toLowerCase() }
    })

    forgotMessage.value = 'If this is a valid admin email, reset instructions were sent.'
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
  <div class="admin-login">
    <form class="admin-login__card" @submit.prevent="loginAsAdmin">
      <h1>Admin Login</h1>
      <p>Sign in with an admin account to manage approvals and machine setup.</p>

      <label class="admin-login__field">
        <span>Email</span>
        <input v-model="email" type="email" autocomplete="email" required />
      </label>

      <label class="admin-login__field">
        <span>Password</span>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="errorMessage" class="admin-login__error">{{ errorMessage }}</p>
      <p v-if="forgotMessage" class="admin-login__success">{{ forgotMessage }}</p>
      <a v-if="devResetUrl" class="admin-login__link" :href="devResetUrl">Open reset link (dev)</a>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Sign in as Admin' }}
      </button>

      <button type="button" class="admin-login__forgot" :disabled="forgotLoading" @click="sendForgotPassword">
        {{ forgotLoading ? 'Sending reset...' : 'Forgot password?' }}
      </button>

      <NuxtLink to="/admin/reset-password" class="admin-login__link">Have a reset token? Reset password</NuxtLink>
    </form>
  </div>
</template>

<style scoped>
.admin-login {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.admin-login__card {
  width: min(500px, 100%);
  display: grid;
  gap: 1rem;
  background: var(--surface-elevated);
  border: 1px solid rgba(128, 176, 224, 0.26);
  border-radius: 14px;
  padding: 1.4rem;
  box-shadow: 0 16px 38px rgba(3, 9, 17, 0.34);
}

.admin-login__card h1 {
  margin: 0;
}

.admin-login__card p {
  margin: 0;
  color: var(--text-primary);
}

.admin-login__field {
  display: grid;
  gap: 0.35rem;
}

.admin-login__field input {
  border: 1px solid rgba(128, 176, 224, 0.3);
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  background: rgba(8, 23, 40, 0.9);
  color: var(--text-primary);
}

.admin-login__field input:focus {
  outline: none;
  border-color: rgba(128, 176, 224, 0.6);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.admin-login__error {
  color: var(--secondary-color);
}

.admin-login__success {
  color: var(--primary-hover);
}

.admin-login__card button {
  border: 1px solid rgba(128, 176, 224, 0.35);
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(145deg, rgba(128, 176, 224, 0.85), rgba(224, 16, 64, 0.72));
  color: var(--text-primary);
  transition: filter 0.2s ease, box-shadow 0.2s ease;
}

.admin-login__card button:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: 0 8px 20px rgba(128, 176, 224, 0.25);
}

.admin-login__card button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.admin-login__forgot {
  background: transparent;
  border: 1px solid rgba(128, 176, 224, 0.3);
  color: var(--primary-color);
}

.admin-login__link {
  color: var(--text-secondary);
  font-size: 0.86rem;
  text-align: center;
  transition: color 0.2s ease;
}

.admin-login__link:hover {
  color: var(--text-primary);
}
</style>
