<template>
    <div class="card">
        <div class="card_header">
            <slot name="title"></slot>
        </div>

        <div class="card_body">
            <slot name="stats"></slot>
        </div>
    </div>
</template>

<style scoped>
.card {
    background: var(--surface-elevated, #10263a);
    border-radius: 16px;
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    padding: 1.5rem;
    transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
    overflow: hidden;
    /* Gradient top-border accent */
    position: relative;
}

.card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, rgba(128, 176, 224, 0), rgba(128, 176, 224, 0.85), rgba(224, 16, 64, 0.7));
    border-radius: 16px 16px 0 0;
}

.card:hover {
    border-color: rgba(128, 176, 224, 0.3);
    background: rgba(16, 38, 58, 0.88);
    box-shadow: 0 10px 30px rgba(3, 9, 17, 0.36), 0 0 0 1px rgba(128, 176, 224, 0.12);
}

.card_header {
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
}

.card_body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* ── Buttons inside card slots ── */
.card_body :deep(button) {
    margin-top: 0.5rem;
    padding: 0.35rem 0.9rem;
    font-size: 0.78rem;
    font-weight: 600;
    font-family: inherit;
    border-radius: 99px;
    border: 1px solid rgba(128, 176, 224, 0.3);
    background: rgba(128, 176, 224, 0.08);
    color: var(--primary-color);
    cursor: pointer;
    transition: background 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
}

.card_body :deep(button:hover) {
    background: rgba(128, 176, 224, 0.16);
    border-color: rgba(128, 176, 224, 0.52);
}

.card_body :deep(button:active) {
    filter: brightness(0.98);
}
</style>