<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <div>
        <h1 class="dashboard__title">Dashboard</h1>
        <p class="dashboard__subtitle">Live machine status and runtime today</p>
      </div>
      <div class="actions-row">
        <button class="refresh-btn" @click="refresh()">Refresh</button>
        <button v-if="isAdmin" class="add-machine-btn" @click="showModal = true">+ Add Machine</button>
      </div>
    </div>

    <p v-if="!isAdmin" class="read-only-note">Read-only access: only admins can add machines.</p>

    <div class="dashboard__grid">
      <Card>
        <template #title>
          <h2 class="card-title">Machine Runtime</h2>
        </template>

        <template #stats>
          <div v-if="isInitialLoad" class="empty-state">Loading machine data...</div>

          <div v-else-if="error" class="empty-state">
            Could not load usage data. Make sure the server is running.
          </div>

          <div v-else-if="!machines.length" class="empty-state">
            No machines found. Add rows to the Microcontroller table first.
          </div>

          <div v-else class="stat-row">
            <div v-for="m in machines" :key="m.id" class="stat-item">
              <div class="stat-label">{{ m.name }}</div>
              <div class="stat-value">{{ formatDuration(m.totalSecondsToday) }}</div>
              <div class="status-row">
                <span class="status-dot" :class="m.isOn ? 'status-on' : 'status-off'" />
                <span>{{ m.isOn ? 'On' : 'Off' }}</span>
              </div>
              <div class="last-seen">Last signal: {{ formatLastSignal(m.lastSignalAt) }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <AddMachineModal
      v-if="showModal && isAdmin"
      @confirm="onConfirm"
      @cancel="showModal = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: [
    (to: { fullPath: string }) => {
      const { loggedIn } = useUserSession()
      if (!loggedIn.value) {
        const redirect = encodeURIComponent(to.fullPath)
        return `/login?redirect=${redirect}`
      }
    }
  ]
})

type RegisterMachinePayload = {
  name: string;
  apiKey: number;
};

type DashboardMachine = {
  id: number;
  name: string;
  isOn: boolean;
  lastSignalAt: string | null;
  totalSecondsToday: number;
  totalMinutesToday: number;
};

type UsageResponse = {
  generatedAt: string;
  machines: DashboardMachine[];
};

const { data, pending, error, refresh } = await useFetch<UsageResponse>(
  '/api/microcontroller/usage',
  {
    server: false,
    lazy: true,
    immediate: true,
  },
);

const REFRESH_INTERVAL_MS = 5000;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
const showModal = ref(false);
const { user } = useUserSession();

onMounted(() => {
  refreshTimer = setInterval(() => {
    refresh();
  }, REFRESH_INTERVAL_MS);
});

onBeforeUnmount(() => {
  if (!refreshTimer) return;
  clearInterval(refreshTimer);
  refreshTimer = null;
});

const machines = computed(() => data.value?.machines ?? []);
const isInitialLoad = computed(() => pending.value && !data.value);
const isAdmin = computed(() => {
  const currentUser = user.value as { role?: string } | null;
  return currentUser?.role === 'admin';
});

const formatDuration = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
};

const formatLastSignal = (value: string | null): string => {
  if (!value) return 'never';
  return new Date(value).toLocaleString();
};

const onConfirm = async (payload: RegisterMachinePayload) => {
  if (!isAdmin.value) return;

  try {
    await $fetch('/api/admin/microcontroller', {
      method: 'POST',
      body: { name: payload.name },
    });

    showModal.value = false;
    await refresh();
  } catch (fetchError: unknown) {
    const message = fetchError instanceof Error
      ? fetchError.message
      : 'Could not add machine';

    alert(message);
  }
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

.actions-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 99px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.35);
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

.read-only-note {
  margin: -0.3rem 0 1rem;
  font-size: 0.88rem;
  color: #93c5fd;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.status-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
}

.status-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
}

.status-on {
  background: #22c55e;
}

.status-off {
  background: #ef4444;
}

.last-seen {
  font-size: 0.72rem;
  opacity: 0.7;
}

.empty-state {
  padding: 0.5rem 0;
  opacity: 0.8;
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

@media (max-width: 600px) {
  .dashboard {
    padding: 1rem;
  }
}
</style>
