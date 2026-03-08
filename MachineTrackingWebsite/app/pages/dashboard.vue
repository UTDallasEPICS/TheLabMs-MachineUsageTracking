<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <div>
        <h1 class="dashboard__title">Dashboard</h1>
        <p class="dashboard__subtitle">Live machine status and runtime today</p>
      </div>
      <div class="actions-row">
        <span class="live-chip" v-if="formattedGeneratedAt">
          <span class="live-dot" aria-hidden="true"></span>
          Updated {{ formattedGeneratedAt }}
        </span>
        <button class="refresh-btn" @click="refresh()">Refresh</button>
      </div>
    </div>

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
const formattedGeneratedAt = computed(() => {
  const value = data.value?.generatedAt
  return value ? new Date(value).toLocaleTimeString() : ''
})

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
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.live-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(128, 176, 224, 0.38);
  background: rgba(128, 176, 224, 0.14);
  font-size: 0.74rem;
  color: var(--text-primary);
}

.live-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--primary-color);
  box-shadow: 0 0 0 rgba(128, 176, 224, 0.62);
  animation: pulse-ring 1.8s ease-out infinite;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  border: 1px solid rgba(128, 176, 224, 0.25);
  border-radius: 99px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.refresh-btn:hover {
  background: rgba(128, 176, 224, 0.12);
  border-color: rgba(128, 176, 224, 0.45);
  box-shadow: 0 4px 14px rgba(8, 23, 40, 0.34);
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem;
  background: rgba(16, 38, 58, 0.54);
  border: 1px solid rgba(128, 176, 224, 0.14);
  border-radius: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.stat-item:hover {
  border-color: rgba(128, 176, 224, 0.28);
  background: rgba(16, 38, 58, 0.7);
  box-shadow: 0 10px 20px rgba(2, 6, 23, 0.22), 0 0 0 1px rgba(128, 176, 224, 0.08);
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
  box-shadow: 0 0 0 rgba(34, 197, 94, 0.6);
  animation: pulse-ring-green 2s ease-out infinite;
}

.status-off {
  background: var(--secondary-color);
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

  .dashboard__header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .actions-row {
    width: 100%;
    justify-content: flex-start;
  }

  .stat-row {
    grid-template-columns: 1fr;
  }

  .stat-item {
    align-items: flex-start;
  }
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(128, 176, 224, 0.62);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(128, 176, 224, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(34, 211, 238, 0);
  }
}

@keyframes pulse-ring-green {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
  }

  70% {
    box-shadow: 0 0 0 7px rgba(34, 197, 94, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}
</style>
