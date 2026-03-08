<script setup lang="ts">
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function register() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    successMessage.value = 'Signup request submitted. An admin must approve your account before you can log in.'
    email.value = ''
    password.value = ''
  } catch (error: unknown) {
    const statusMessage = (error as { data?: { message?: string } })?.data?.message
    errorMessage.value = statusMessage || 'Could not submit signup request.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="register">
      <h1>Create Account</h1>
      <p>Your request will be queued for admin approval.</p>

      <label>
        <span>Email</span>
        <input v-model="email" type="email" autocomplete="email" required />
      </label>

      <label>
        <span>Password</span>
        <input v-model="password" type="password" autocomplete="new-password" minlength="8" required />
      </label>

      <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="auth-success">{{ successMessage }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Submitting...' : 'Request Account' }}
      </button>

      <NuxtLink to="/login" class="auth-link">Already approved? Sign in</NuxtLink>
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

.auth-success {
  color: #86efac;
}

.auth-link {
  color: #7dd3fc;
  text-decoration: none;
}
</style>
