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
</style>
