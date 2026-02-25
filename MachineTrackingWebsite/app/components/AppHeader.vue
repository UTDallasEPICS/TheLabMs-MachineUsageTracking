<template>
  <header class="app-header">
    <div class="logo">
      <h1>Machine Usage Tracking</h1>
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
  padding: 1rem 2rem;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px); /* Glassmorphism */
  background: rgba(30, 41, 59, 0.8); /* Semi-transparent */
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  cursor: pointer;
  letter-spacing: -0.5px;
}

.nav-container {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
}
</style>