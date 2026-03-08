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
  position: relative;
  animation: title-breathe 4.5s ease-in-out infinite;
}

.logo h1::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.25rem;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0), rgba(56, 189, 248, 0.95), rgba(129, 140, 248, 0));
  opacity: 0.85;
  transform-origin: left;
  animation: title-sweep 4s ease-in-out infinite;
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

@keyframes title-breathe {
  0%,
  100% {
    filter: drop-shadow(0 0 0 rgba(56, 189, 248, 0));
  }

  50% {
    filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.25));
  }
}

@keyframes title-sweep {
  0%,
  100% {
    transform: scaleX(0.55);
    opacity: 0.45;
  }

  50% {
    transform: scaleX(1);
    opacity: 1;
  }
}
</style>