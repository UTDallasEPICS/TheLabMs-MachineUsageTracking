<script setup lang="ts">
const { app } = useRuntimeConfig()
const headerLogoSrc = computed(() => `${app.baseURL.replace(/\/$/, '')}/Picture2.png`)
</script>

<template>
  <header class="app-header">
    <div class="brand-lockup">
      <img class="brand-logo" :src="headerLogoSrc" alt="The Lab MS logo" />
      <div class="brand-text">
        <h1>The Lab MS</h1>
        <p>Machine Usage Tracking</p>
      </div>
    </div>
    <div class="nav-container">
      <Nav />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  background: rgba(16, 38, 58, 0.82);
}

.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
}

.brand-logo {
  width: 150px;
  height: 104px;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid rgba(128, 176, 224, 0.2);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
}

.brand-text h1 {
  font-size: 1.3rem;
  line-height: 1.1;
  font-weight: 700;
  color: var(--secondary-color);
  margin: 0;
  letter-spacing: 0.01em;
}

.brand-text p {
  margin: 0.1rem 0 0;
  font-size: 0.76rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.nav-container {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
    padding: 0.8rem;
  }

  .brand-text h1 {
    font-size: 1.12rem;
  }

  .brand-text p {
    font-size: 0.68rem;
    letter-spacing: 0.07em;
  }

  .nav-container {
    justify-content: flex-start;
  }

  .brand-logo {
    width: 112px;
    height: 78px;
  }

}
</style>