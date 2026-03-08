<script setup lang="ts">
const route = useRoute()
const { loggedIn, user, fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

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

      <button type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </button>

      <NuxtLink to="/register" class="auth-link">Need an account? Request signup</NuxtLink>
    </form>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
  padding: 1.25rem;
}

.auth-card {
  width: min(460px, 100%);
  display: grid;
  gap: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.65);
  padding: 1.2rem;
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
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  padding: 0.55rem 0.65rem;
  background: rgba(2, 6, 23, 0.8);
  color: #e2e8f0;
}

.auth-card button {
  border: 0;
  border-radius: 8px;
  padding: 0.58rem 0.7rem;
  background: #0ea5e9;
  color: #082f49;
  font-weight: 700;
  cursor: pointer;
}

.auth-card button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-error {
  color: #fca5a5;
}

.auth-link {
  color: #7dd3fc;
  text-decoration: none;
}
</style>
