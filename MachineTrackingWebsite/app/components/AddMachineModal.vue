<template>
  <div class="modal-backdrop" @click.self="$emit('cancel')">
    <div class="modal">
      <h2 class="modal__title">Add Machine</h2>
      <p class="modal__subtitle">Fill in the details for the new machine.</p>

      <form class="modal__form" @submit.prevent="handleConfirm">
        <div class="form-group">
          <label for="machine-name">Name <span class="required">*</span></label>
          <input
            id="machine-name"
            v-model="form.name"
            type="text"
            placeholder="e.g. Machine 5"
            autocomplete="off"
            required
          />
        </div>

        <div class="form-group">
          <label for="machine-api-key">API Key <span class="required">*</span></label>
          <input
            id="machine-api-key"
            v-model="form.apiKey"
            type="text"
            placeholder="e.g. abc123xyz"
            required
          />
        </div>

        <div class="modal__actions">
          <button type="button" class="btn-cancel" @click="$emit('cancel')">Cancel</button>
          <button type="submit" class="btn-confirm">+ Add Machine</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const emit = defineEmits<{
  confirm: [data: { name: string; apiKey: string }];
  cancel: [];
}>();

const form = reactive({
  name: '',
  apiKey: '',
});

const handleConfirm = () => {
  if (!form.name.trim()) return;
  if (!form.apiKey.trim()) return;

  emit('confirm', {
    name: form.name.trim(),
    apiKey: form.apiKey.trim(),
  });
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
  animation: fade-in 0.2s ease;
}

.modal {
  background: rgba(16, 38, 58, 0.96);
  border: 1px solid rgba(128, 176, 224, 0.28);
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  animation: slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* Gradient top accent */
  position: relative;
  overflow: hidden;
}

.modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(128, 176, 224, 0.75), rgba(224, 16, 64, 0.65));
}

.modal__title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.modal__subtitle {
  font-size: 0.85rem;
  opacity: 0.5;
  margin: 0 0 1.5rem;
}

/* ── Form ── */
.modal__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.6;
}

.required {
  color: #ff8aa9;
}

.form-group input {
  width: 100%;
  padding: 0.6rem 0.9rem;
  font-size: 0.9rem;
  font-family: inherit;
  background: rgba(8, 23, 40, 0.88);
  border: 1px solid rgba(128, 176, 224, 0.24);
  border-radius: 10px;
  color: inherit;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.form-group input::placeholder {
  opacity: 0.35;
}

.form-group input:focus {
  border-color: rgba(128, 176, 224, 0.6);
  box-shadow: 0 0 0 3px rgba(128, 176, 224, 0.16);
}

/* ── Actions ── */
.modal__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-cancel {
  padding: 0.5rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  border-radius: 99px;
  border: 1px solid rgba(128, 176, 224, 0.22);
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.btn-cancel:hover {
  opacity: 1;
  background: rgba(128, 176, 224, 0.1);
}

.btn-confirm {
  padding: 0.5rem 1.2rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  border: none;
  border-radius: 99px;
  background: linear-gradient(135deg, rgba(128, 176, 224, 0.95), rgba(224, 16, 64, 0.75));
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(128, 176, 224, 0.35);
  transition: box-shadow 0.2s ease, filter 0.2s ease;
}

.btn-confirm:hover {
  box-shadow: 0 6px 20px rgba(128, 176, 224, 0.45);
  filter: brightness(1.1);
}

.btn-confirm:active {
  filter: brightness(0.98);
}

/* ── Animations ── */
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
