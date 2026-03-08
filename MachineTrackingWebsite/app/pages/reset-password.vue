<script setup lang="ts">
const route = useRoute()

const token = ref(typeof route.query.token === 'string' ? route.query.token : '')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function resetPassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!token.value.trim()) {
    errorMessage.value = 'Reset token is required.'
    return
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/password/reset', {
      method: 'POST',
      body: {
        token: token.value.trim(),
        newPassword: newPassword.value
      }
    })

    successMessage.value = 'Password updated. You can now sign in.'
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    errorMessage.value = message || 'Could not reset password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="user-reset">
    <form class="user-reset__card" @submit.prevent="resetPassword">
      <h1>Reset Password</h1>
      <p>Enter your reset token and choose a new password.</p>

      <label class="user-reset__field">
        <span>Reset Token</span>
        <input v-model="token" type="text" autocomplete="off" required />
      </label>

      <label class="user-reset__field">
        <span>New Password</span>
        <input v-model="newPassword" type="password" autocomplete="new-password" minlength="8" required />
      </label>

      <label class="user-reset__field">
        <span>Confirm New Password</span>
        <input v-model="confirmPassword" type="password" autocomplete="new-password" minlength="8" required />
      </label>

      <p v-if="errorMessage" class="user-reset__error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="user-reset__success">{{ successMessage }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Resetting...' : 'Reset Password' }}
      </button>

      <NuxtLink to="/login" class="user-reset__link">Back to User Login</NuxtLink>
    </form>
  </div>
</template>

<style scoped>
.user-reset {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.user-reset__card {
  width: min(500px, 100%);
  display: grid;
  gap: 1rem;
  background: var(--surface-elevated);
  border: 1px solid rgba(128, 176, 224, 0.26);
  border-radius: 14px;
  padding: 1.4rem;
  box-shadow: 0 16px 38px rgba(3, 9, 17, 0.34);
}

.user-reset__card h1 {
  margin: 0;
}

.user-reset__card p {
  margin: 0;
  color: var(--text-secondary);
}

.user-reset__field {
  display: grid;
  gap: 0.35rem;
}

.user-reset__field input {
  border: 1px solid rgba(128, 176, 224, 0.3);
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  background: rgba(8, 23, 40, 0.9);
  color: var(--text-primary);
}

.user-reset__field input:focus {
  outline: none;
  border-color: rgba(128, 176, 224, 0.6);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.user-reset__error {
  color: var(--secondary-color);
}

.user-reset__success {
  color: var(--primary-hover);
}

.user-reset__card button {
  border: 1px solid rgba(128, 176, 224, 0.35);
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(145deg, rgba(128, 176, 224, 0.85), rgba(224, 16, 64, 0.72));
  color: var(--text-primary);
  transition: filter 0.2s ease, box-shadow 0.2s ease;
}

.user-reset__card button:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: 0 8px 20px rgba(128, 176, 224, 0.25);
}

.user-reset__card button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.user-reset__link {
  color: var(--text-secondary);
  font-size: 0.86rem;
  text-align: center;
  text-decoration: none;
  transition: color 0.2s ease;
}

.user-reset__link:hover {
  color: var(--text-primary);
}
</style>
