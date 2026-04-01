<template>
  <div class="timeline-page">
    <div class="timeline-page__header">
      <div class="header-left">
        <button class="back-btn" @click="goToDashboard">&#8592; Back to Dashboard</button>
        <div>
          <h1 class="page-title">Machine Timeline</h1>
          <p class="page-subtitle">{{ formattedDate }}</p>
        </div>
      </div>
    </div>

    <Card class="timeline-card">
      <template #stats>
        <div v-if="pending" class="empty-state">Loading timeline data...</div>
        <div v-else-if="error" class="empty-state">Could not load timeline data.</div>
        <div v-else-if="!data?.machines.length" class="empty-state">No machines found.</div>
        <div v-else class="gantt-container">
          <!-- Timeline Axis (0 to 24 hours) -->
          <div class="gantt-header">
            <div class="gantt-header-label" style="width: 150px"></div>
            <div class="gantt-axis">
              <div v-for="h in 25" :key="h" class="gantt-tick" :style="{ left: ((h - 1) / 24) * 100 + '%' }">
                <span class="tick-label" v-if="(h - 1) % 2 === 0">{{ String(h - 1).padStart(2, '0') }}:00</span>
              </div>
            </div>
          </div>

          <!-- Machine Tracks -->
          <div class="gantt-body">
            <div v-for="(machine, index) in data.machines" :key="machine.id" class="gantt-row">
              <div class="gantt-machine-label">
                <span class="machine-dot" :style="{ background: machineColor(machine.id, index) }"></span>
                <span class="machine-name">{{ machine.name }}</span>
              </div>
              <div class="gantt-track">
                <!-- Background grid lines -->
                <div v-for="h in 24" :key="'grid-'+h" class="gantt-grid-line" :style="{ left: ((h) / 24) * 100 + '%' }"></div>
                
                <!-- Usage Blocks -->
                <div
                  v-for="session in machine.sessions"
                  :key="session.id"
                  class="gantt-block"
                  :style="{
                    left: session.startPercent + '%',
                    width: Math.max(0.5, session.widthPercent) + '%',
                    background: machineColor(machine.id, index)
                  }"
                  :title="formatTooltip(session.startedAt, session.endedAt, session.isOngoing)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: [
    (to) => {
      const { loggedIn } = useUserSession()
      if (!loggedIn.value) {
        return `/login?redirect=${encodeURIComponent(to.fullPath)}`
      }
    }
  ]
})

const route = useRoute()
const dateParam = route.params.date as string

function goToDashboard() {
  navigateTo('/dashboard')
}

// ── Format helpers
const formattedDate = computed(() => {
  if (!dateParam) return ''
  // make sure to parse local time properly
  const [y, m, d] = dateParam.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

function formatTooltip(start: string, end: string | null, isOngoing: boolean) {
  const dStart = new Date(start)
  const sStr = dStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  
  if (isOngoing || !end) {
    return `Started: ${sStr}\nOngoing`
  }
  const dEnd = new Date(end)
  const eStr = dEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return `Started: ${sStr}\nEnded: ${eStr}`
}

// ── Colors (matching dashboard palette)
// Add more color if more machine is going to use
const MACHINE_COLORS = [
  '#80b0e0',
  '#e0405a',
  '#50c878',
  '#f0a030',
  '#a880e0',
  '#40c8c8',
  '#e08050',
]

function machineColor(id: number, idx: number): string {
  // We don't have the exact index match from dashboard across different arrays, 
  // but using idx modulo is good enough for visually distinct tracks.
  return MACHINE_COLORS[idx % MACHINE_COLORS.length]
}

// ── Fetch
const { data, pending, error } = await useFetch(`/api/microcontroller/timeline`, {
  query: { date: dateParam },
  lazy: true,
  server: false
})
</script>

<style scoped>
.timeline-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.timeline-page__header {
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.back-btn {
  align-self: flex-start;
  background: rgba(16, 38, 58, 0.5);
  border: 1px solid rgba(128, 176, 224, 0.25);
  border-radius: 99px;
  padding: 0.4rem 0.9rem;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(128, 176, 224, 0.15);
  border-color: rgba(128, 176, 224, 0.5);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-size: 1rem;
  margin: 0;
  opacity: 0.7;
}

/* ── Gantt Chart ── */
.gantt-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.gantt-header {
  display: flex;
  border-bottom: 1px solid rgba(128, 176, 224, 0.15);
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  min-width: 800px;
}

.gantt-header-label {
  flex-shrink: 0;
}

.gantt-axis {
  flex: 1;
  position: relative;
  height: 20px;
}

.gantt-tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tick-label {
  font-size: 0.75rem;
  opacity: 0.6;
  font-weight: 600;
}

.gantt-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 800px;
}

.gantt-row {
  display: flex;
  align-items: center;
  height: 48px;
  background: rgba(16, 38, 58, 0.3);
  border-radius: 8px;
  transition: background 0.2s;
}

.gantt-row:hover {
  background: rgba(16, 38, 58, 0.6);
}

.gantt-machine-label {
  width: 150px;
  flex-shrink: 0;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-right: 1px solid rgba(128, 176, 224, 0.1);
}

.machine-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.machine-name {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-track {
  flex: 1;
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.gantt-grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(128, 176, 224, 0.05);
}

.gantt-block {
  position: absolute;
  height: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, filter 0.2s;
  cursor: pointer;
  z-index: 2;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.2));
}

.gantt-block:hover {
  transform: translateY(-2px);
  filter: drop-shadow(0 0 4px currentColor) brightness(1.1);
  z-index: 3;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  opacity: 0.7;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .timeline-page {
    padding: 1rem;
  }
}
</style>
