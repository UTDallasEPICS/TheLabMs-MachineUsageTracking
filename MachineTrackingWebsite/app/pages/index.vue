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
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.88));
    padding: 1.6rem;
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
    border-radius: 999px;
    padding: 0.55rem 1rem;
    font-weight: 600;
    font-size: 0.9rem;
}

.btn--primary {
    background: var(--accent-gradient);
    color: white;
}

.btn--ghost {
    border: 1px solid rgba(148, 163, 184, 0.35);
    color: var(--text-primary);
}

.quick-grid {
    display: grid;
    gap: 0.9rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.quick-card {
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.65);
    padding: 1rem;
}

.quick-card h2 {
    font-size: 1rem;
    margin-bottom: 0.4rem;
}

.quick-card p {
    color: var(--text-secondary);
    font-size: 0.92rem;
}
</style>

