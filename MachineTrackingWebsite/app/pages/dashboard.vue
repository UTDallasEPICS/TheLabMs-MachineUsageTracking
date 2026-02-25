<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <div>
        <h1 class="dashboard__title">Dashboard</h1>
        <p class="dashboard__subtitle">Metrics of the machine usage</p>
      </div>
      <button class="add-machine-btn" @click="showModal = true">+ Add Machine</button>
    </div>

    <div class="dashboard__grid">
      <Card>
        <template #title>
          <h2 class="card-title">Power</h2>
        </template>

        <template #stats>
          <div class="stat-row">
            <div v-for="m in machine" :key="m.id" class="stat-item">
              <div class="stat-label">{{ m.name }}</div>
              <div class="stat-value">{{ m.voltage_usage }}V</div>
              <button class="remove-machine-btn" @click="removeMachine(m.id)">Remove machine</button>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <AddMachineModal
      v-if="showModal"
      @confirm="onConfirm"
      @cancel="showModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type Machine = {
  id: number;
  name: string;
  voltage_usage: number;
  description: string;
};

const machine = ref<Machine[]>([]);
const showModal = ref(false);

const onConfirm = (data: Omit<Machine, 'id'>) => {
  machine.value.push({ id: Date.now(), ...data });
  showModal.value = false;
};

const removeMachine = (id: number) => {
  machine.value = machine.value.filter((m) => m.id !== id);
};
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.dashboard__title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.dashboard__subtitle {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.6;
}

.add-machine-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.2rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  border: none;
  border-radius: 99px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(56, 189, 248, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.add-machine-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
  filter: brightness(1.1);
}

.add-machine-btn:active {
  transform: translateY(0) scale(0.97);
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.3);
}

.dashboard__grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.5;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
}

.remove-machine-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.85rem;
  font-size: 0.72rem;
  font-weight: 700;
  font-family: inherit;
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 99px;
  background: rgba(248, 113, 113, 0.08);
  color: #f87171;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease,
              box-shadow 0.2s ease, border-color 0.2s ease;
}

.remove-machine-btn:hover {
  background: rgba(248, 113, 113, 0.18);
  border-color: rgba(248, 113, 113, 0.6);
  box-shadow: 0 4px 14px rgba(248, 113, 113, 0.3);
  transform: translateY(-1px);
}

.remove-machine-btn:active {
  transform: scale(0.96);
  box-shadow: none;
}

@media (max-width: 600px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard {
    padding: 1rem;
  }
}
</style>
