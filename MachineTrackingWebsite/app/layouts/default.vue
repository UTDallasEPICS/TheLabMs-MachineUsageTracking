<template>
    <div class="layout-container">
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
}

.content {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}
</style>
