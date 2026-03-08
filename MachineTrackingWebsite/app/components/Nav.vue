<template>
  <nav class="navbar">
    <ul class="navbar-list">
      <li class="navbar-item"><NuxtLink to="/" class="navbar-link">Home</NuxtLink></li>
      <li class="navbar-item"><NuxtLink to="/dashboard" class="navbar-link">Dashboard</NuxtLink></li>
      <li class="navbar-item"><NuxtLink to="/admin/login" class="navbar-link">Admin</NuxtLink></li>
      <li v-if="!loggedIn" class="navbar-item"><NuxtLink to="/login" class="navbar-link">Login</NuxtLink></li>
      <li v-if="!loggedIn" class="navbar-item"><NuxtLink to="/register" class="navbar-link">Register</NuxtLink></li>
      <li v-if="loggedIn" class="navbar-item"><button type="button" class="navbar-link navbar-button" @click="logout">Logout</button></li>
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
  min-height: 2.8rem;
}

.navbar-list {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  list-style: none;
}

.navbar-item {
  display: flex;
  align-items: center;
}

.navbar-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 1.08rem;
  line-height: 1;
  height: 2.75rem;
  padding: 0.65rem 1.3rem;
  border-radius: 99px;
  border: 1px solid transparent;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  text-decoration: none;
  white-space: nowrap;
  box-sizing: border-box;
}

.navbar-link:hover {
  color: var(--text-primary);
  background: rgba(128, 176, 224, 0.1);
  border-color: rgba(128, 176, 224, 0.18);
  box-shadow: 0 0 0 1px rgba(128, 176, 224, 0.08);
}

.navbar-link.router-link-active {
  color: var(--text-primary);
  background: linear-gradient(145deg, rgba(128, 176, 224, 0.16), rgba(128, 176, 224, 0.07));
  border-color: rgba(128, 176, 224, 0.26);
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
  background: var(--secondary-color);
  border-radius: 50%;
  opacity: 0;
}

.navbar-button {
  border: none;
  background-color: transparent;
  cursor: pointer;
  font: inherit;
  color: var(--text-secondary);
  line-height: inherit;
  padding: 0.65rem 1.3rem;
  appearance: none;
  -webkit-appearance: none;
}

@media (max-width: 900px) {
  .navbar-list {
    gap: 0.55rem;
  }

  .navbar-link {
    height: 2.35rem;
    padding: 0.52rem 0.95rem;
    font-size: 0.98rem;
  }
}

@media (max-width: 640px) {
  .navbar {
    width: 100%;
  }

  .navbar-list {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>