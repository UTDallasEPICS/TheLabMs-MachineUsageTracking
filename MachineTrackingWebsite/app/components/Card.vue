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
    background: var(--surface-color, #1e293b);
    border-radius: 16px;
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    padding: 1.5rem;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
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
    background: linear-gradient(90deg, #38bdf8, #818cf8, #34d399);
    border-radius: 16px 16px 0 0;
}

.card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
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
    border: 1px solid rgba(56, 189, 248, 0.3);
    background: rgba(56, 189, 248, 0.08);
    color: #38bdf8;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
}

.card_body :deep(button:hover) {
    background: rgba(56, 189, 248, 0.18);
    border-color: rgba(56, 189, 248, 0.55);
    transform: scale(1.04);
}

.card_body :deep(button:active) {
    transform: scale(0.97);
}
</style>