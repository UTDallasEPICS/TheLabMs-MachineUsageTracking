<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function changeMyPassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (newPassword.value.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters.'
    return
  }

  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = 'New password and confirmation do not match.'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/admin/password/change', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      }
    })

    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    successMessage.value = 'Password changed successfully.'
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    errorMessage.value = message || 'Could not change password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="admin-password-page">
    <form class="admin-password-page__card" @submit.prevent="changeMyPassword">
      <h1>Change Admin Password</h1>
      <p>Update your admin password on this dedicated page to keep the dashboard compact.</p>

      <label class="admin-password-page__field">
        <span>Current Password</span>
        <input v-model="currentPassword" type="password" autocomplete="current-password" required />
      </label>

      <label class="admin-password-page__field">
        <span>New Password</span>
        <input v-model="newPassword" type="password" autocomplete="new-password" minlength="8" required />
      </label>

      <label class="admin-password-page__field">
        <span>Confirm New Password</span>
        <input v-model="confirmNewPassword" type="password" autocomplete="new-password" minlength="8" required />
      </label>

      <p v-if="errorMessage" class="admin-password-page__error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="admin-password-page__success">{{ successMessage }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Updating...' : 'Update Password' }}
      </button>

      <NuxtLink to="/admin" class="admin-password-page__link">Back to Admin Dashboard</NuxtLink>
    </form>
  </div>
</template>

<style scoped>
.admin-password-page {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.admin-password-page__card {
  width: min(500px, 100%);
  display: grid;
  gap: 1rem;
  background: var(--surface-elevated);
  border: 1px solid rgba(128, 176, 224, 0.26);
  border-radius: 14px;
  padding: 1.4rem;
  box-shadow: 0 16px 38px rgba(3, 9, 17, 0.34);
}

.admin-password-page__card h1 {
  margin: 0;
}

.admin-password-page__card p {
  margin: 0;
  color: var(--text-secondary);
}

.admin-password-page__field {
  display: grid;
  gap: 0.35rem;
}

.admin-password-page__field input {
  border: 1px solid rgba(128, 176, 224, 0.3);
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  background: rgba(8, 23, 40, 0.9);
  color: var(--text-primary);
}

.admin-password-page__field input:focus {
  outline: none;
  border-color: rgba(128, 176, 224, 0.6);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.admin-password-page__error {
  color: var(--secondary-color);
}

.admin-password-page__success {
  color: var(--primary-hover);
}

.admin-password-page__card button {
  border: 1px solid rgba(128, 176, 224, 0.35);
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(145deg, rgba(128, 176, 224, 0.85), rgba(224, 16, 64, 0.72));
  color: var(--text-primary);
  transition: filter 0.2s ease, box-shadow 0.2s ease;
}

.admin-password-page__card button:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: 0 8px 20px rgba(128, 176, 224, 0.25);
}

.admin-password-page__card button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.admin-password-page__link {
  color: var(--text-secondary);
  font-size: 0.86rem;
  text-align: center;
  text-decoration: none;
  transition: color 0.2s ease;
}

.admin-password-page__link:hover {
  color: var(--text-primary);
}
</style>
