<script setup lang="ts">
const route = useRoute()
const { loggedIn, user } = useUserSession()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const redirectTarget = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/admin'
})

watchEffect(() => {
  const currentUser = user.value as { role?: string } | null
  if (loggedIn.value && currentUser?.role === 'admin') {
    navigateTo(redirectTarget.value)
  }
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

      <button type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Sign in as Admin' }}
      </button>
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
  width: min(460px, 100%);
  display: grid;
  gap: 1rem;
  background: rgba(2, 6, 23, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 14px;
  padding: 1.4rem;
}

.admin-login__card h1 {
  margin: 0;
}

.admin-login__card p {
  margin: 0;
  color: rgba(226, 232, 240, 0.85);
}

.admin-login__field {
  display: grid;
  gap: 0.35rem;
}

.admin-login__field input {
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  background: rgba(15, 23, 42, 0.85);
  color: #e2e8f0;
}

.admin-login__error {
  color: #fca5a5;
}

.admin-login__card button {
  border: 0;
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
  background: #0ea5e9;
  color: #082f49;
}

.admin-login__card button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
