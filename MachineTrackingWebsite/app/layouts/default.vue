<template>
    <div class="layout-container">
        <div class="ambient ambient--top" aria-hidden="true"></div>
        <div class="ambient ambient--bottom" aria-hidden="true"></div>
        <div class="ambient-grid" aria-hidden="true"></div>
        <AppHeader></AppHeader>
        <main class="content">
            <slot></slot>
        </main>
        <AppFooter></AppFooter>
    </div>
</template>

<style scoped>
.layout-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow-x: clip;
}

.content {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    z-index: 2;
}

.ambient {
    position: fixed;
    pointer-events: none;
    z-index: 0;
    border-radius: 999px;
    filter: blur(54px);
    opacity: 0.2;
}

.ambient--top {
    width: 360px;
    height: 360px;
    right: -130px;
    top: 60px;
    background: rgba(56, 189, 248, 0.52);
}

.ambient--bottom {
    width: 320px;
    height: 320px;
    left: -120px;
    bottom: 40px;
    background: rgba(129, 140, 248, 0.46);
}

.ambient-grid {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.15;
    background-image:
        linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
    background-size: 36px 36px;
    mask-image: radial-gradient(circle at center, black 10%, transparent 76%);
}

@media (max-width: 768px) {
    .ambient--top {
        width: 260px;
        height: 260px;
        right: -90px;
        top: 80px;
    }

    .ambient--bottom {
        width: 220px;
        height: 220px;
        left: -80px;
        bottom: 70px;
    }
}
</style>
