<script setup lang="ts">
const { loggedIn, user } = useUserSession()

const isAdmin = computed(() => {
    const currentUser = user.value as { role?: string } | null
    return currentUser?.role === 'admin'
})
</script>

<template>
    <div class="home-page">
        <section class="hero">
            <div class="hero__glow hero__glow--one" aria-hidden="true" />
            <div class="hero__glow hero__glow--two" aria-hidden="true" />
            <p class="hero__eyebrow">The Lab MS</p>
            <h1 class="hero__title">Machine Usage Tracking</h1>
            <p class="hero__subtitle">
                Track machine status in real time, review daily runtime, and manage user access from one dashboard.
            </p>

            <div class="hero__actions" v-if="!loggedIn">
                <NuxtLink class="btn btn--primary" to="/login">User Login</NuxtLink>
                <NuxtLink class="btn btn--ghost" to="/register">Request Account</NuxtLink>
                <NuxtLink class="btn btn--ghost" to="/admin/login">Admin Login</NuxtLink>
            </div>

            <div class="hero__actions" v-else>
                <NuxtLink class="btn btn--primary" to="/dashboard">Open Dashboard</NuxtLink>
                <NuxtLink v-if="isAdmin" class="btn btn--ghost" to="/admin">Open Admin Panel</NuxtLink>
            </div>
        </section>

        <section class="quick-grid">
            <article class="quick-card">
                <h2>Users</h2>
                <p>Approved users can log in and view live machine state plus runtime totals.</p>
            </article>

            <article class="quick-card">
                <h2>Admins</h2>
                <p>Admins approve pending requests and register new microcontrollers securely.</p>
            </article>

            <article class="quick-card">
                <h2>Data Flow</h2>
                <p>Devices send sensor/session events, and the dashboard summarizes machine usage for today.</p>
            </article>
        </section>
    </div>
</template>

<style scoped>
.home-page {
    display: grid;
    gap: 1.5rem;
}

.hero {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(128, 176, 224, 0.22);
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(16, 38, 58, 0.9), rgba(8, 23, 40, 0.9));
    padding: 1.6rem;
    isolation: isolate;
}

.hero__glow {
    position: absolute;
    border-radius: 999px;
    filter: blur(26px);
    opacity: 0.2;
    z-index: -1;
    animation: drift 10s ease-in-out infinite;
}

.hero__glow--one {
    width: 190px;
    height: 190px;
    right: -40px;
    top: -40px;
    background: rgba(128, 176, 224, 0.4);
}

.hero__glow--two {
    width: 150px;
    height: 150px;
    left: -30px;
    bottom: -40px;
    background: rgba(224, 16, 64, 0.22);
    animation-delay: -2.5s;
}

.hero__eyebrow {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--primary-color);
    font-weight: 600;
}

.hero__title {
    margin-top: 0.35rem;
    font-size: clamp(1.8rem, 4vw, 2.5rem);
    line-height: 1.1;
}

.hero__subtitle {
    margin-top: 0.65rem;
    color: var(--text-secondary);
    max-width: 62ch;
}

.hero__actions {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    border-radius: 999px;
    padding: 0.55rem 1rem;
    font-weight: 600;
    font-size: 0.9rem;
    transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease, border-color 0.22s ease, background 0.22s ease;
}

.btn--primary {
    background: var(--accent-gradient);
    color: white;
    box-shadow: 0 4px 14px rgba(128, 176, 224, 0.24);
}

.btn--primary:hover {
    filter: brightness(1.08);
    box-shadow: 0 10px 24px rgba(128, 176, 224, 0.3);
}

.btn--ghost {
    border: 1px solid rgba(128, 176, 224, 0.3);
    color: var(--text-primary);
    background: rgba(8, 23, 40, 0.5);
}

.btn--ghost:hover {
    border-color: rgba(128, 176, 224, 0.52);
    background: rgba(16, 38, 58, 0.64);
}

.quick-grid {
    display: grid;
    gap: 0.9rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.quick-card {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(128, 176, 224, 0.2);
    border-radius: 12px;
    background: rgba(8, 23, 40, 0.68);
    padding: 1rem;
    transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.quick-card::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 2px;
    background: linear-gradient(90deg, rgba(128, 176, 224, 0), rgba(128, 176, 224, 0.84), rgba(224, 16, 64, 0.48));
    opacity: 0;
    transition: opacity 0.22s ease;
}

.quick-card:hover {
    border-color: rgba(128, 176, 224, 0.34);
    background: rgba(10, 27, 46, 0.78);
    box-shadow: 0 12px 24px rgba(2, 6, 23, 0.28), 0 0 0 1px rgba(128, 176, 224, 0.1);
}

.quick-card:hover::before {
    opacity: 1;
}

.quick-card h2 {
    font-size: 1rem;
    margin-bottom: 0.4rem;
}

.quick-card p {
    color: var(--text-secondary);
    font-size: 0.92rem;
}

@media (max-width: 768px) {
    .hero {
        padding: 1.15rem;
    }

    .hero__subtitle {
        font-size: 0.92rem;
    }

    .hero__actions {
        flex-direction: column;
        align-items: stretch;
    }

    .btn {
        width: 100%;
        min-height: 2.6rem;
    }
}

@keyframes drift {
    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(8px);
    }
}
</style>

