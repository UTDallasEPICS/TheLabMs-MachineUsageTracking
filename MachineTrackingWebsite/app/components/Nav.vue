<template>
  <nav class="navbar">
    <ul class="navbar-list">
      <li><NuxtLink to="/" class="navbar-link">Home</NuxtLink></li>
      <li><NuxtLink to="/dashboard" class="navbar-link">Dashboard</NuxtLink></li>
      <li><NuxtLink to="/admin/login" class="navbar-link">Admin</NuxtLink></li>
      <li v-if="!loggedIn"><NuxtLink to="/login" class="navbar-link">Login</NuxtLink></li>
      <li v-if="!loggedIn"><NuxtLink to="/register" class="navbar-link">Register</NuxtLink></li>
      <li v-if="loggedIn"><button class="navbar-link navbar-button" @click="logout">Logout</button></li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const { loggedIn, fetch: refreshSession } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/login')
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
}

.navbar-list {
  display: flex;
  gap: 2rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.navbar-link {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  transition: all 0.3s ease;
  position: relative;
}

.navbar-link:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.navbar-link.router-link-active {
  color: var(--primary-color);
  background: rgba(56, 189, 248, 0.1);
  font-weight: 600;
}

.navbar-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--primary-color);
  border-radius: 50%;
  opacity: 0; /* Hidden for now, maybe nicer without it if using pill bg */
}

.navbar-button {
  border: 0;
  background: transparent;
  cursor: pointer;
}
</style>