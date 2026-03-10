<script setup lang="ts">
const mouseLightX = ref(50)
const mouseLightY = ref(12)
const mouseLightOpacity = ref(0.03)

const mouseLightStyle = computed<Record<string, string>>(() => ({
    '--mouse-light-x': `${mouseLightX.value}%`,
    '--mouse-light-y': `${mouseLightY.value}%`,
    '--mouse-light-opacity': String(mouseLightOpacity.value)
}))

function onWindowPointerMove(event: PointerEvent) {
    if (!window.innerWidth || !window.innerHeight) return

    mouseLightX.value = Math.max(0, Math.min(100, (event.clientX / window.innerWidth) * 100))
    mouseLightY.value = Math.max(0, Math.min(100, (event.clientY / window.innerHeight) * 100))
    mouseLightOpacity.value = 0.06
}

function resetMouseLight() {
    mouseLightX.value = 50
    mouseLightY.value = 12
    mouseLightOpacity.value = 0.03
}

onMounted(() => {
    window.addEventListener('pointermove', onWindowPointerMove, { passive: true })
    window.addEventListener('blur', resetMouseLight)
    document.addEventListener('mouseleave', resetMouseLight)
})

onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('blur', resetMouseLight)
    document.removeEventListener('mouseleave', resetMouseLight)
})
</script>

<template>
        <div class="layout-container">
        <div class="ambient ambient--top" aria-hidden="true"></div>
        <div class="ambient ambient--bottom" aria-hidden="true"></div>
                <div class="ambient-pointer" aria-hidden="true" :style="mouseLightStyle"></div>
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
    padding: 1.75rem;
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
    background: rgba(128, 176, 224, 0.45);
}

.ambient--bottom {
    width: 320px;
    height: 320px;
    left: -120px;
    bottom: 40px;
    background: rgba(224, 16, 64, 0.2);
}

.ambient-grid {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.5;
    background-image:
        linear-gradient(rgba(128, 176, 224, 0.09) 1px, transparent 1px),
        linear-gradient(90deg, rgba(128, 176, 224, 0.09) 1px, transparent 1px);
    background-size: 36px 36px;
}

.ambient-pointer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(
        280px circle at var(--mouse-light-x, 50%) var(--mouse-light-y, 12%),
        rgba(128, 176, 224, var(--mouse-light-opacity, 0.03)),
        rgba(128, 176, 224, 0) 70%
    );
    transition: opacity 0.25s ease, background-position 0.08s linear;
}

@media (max-width: 768px) {
    .content {
        padding: 1rem;
    }

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
