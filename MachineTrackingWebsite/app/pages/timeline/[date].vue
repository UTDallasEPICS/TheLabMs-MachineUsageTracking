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
        <div v-else class="gantt-wrapper">
          <!-- Zoom hint bar -->
          <div class="zoom-controls">
            <span class="zoom-hint">&#8679; Ctrl + scroll to zoom &nbsp;·&nbsp; scroll to pan</span>
            <button class="zoom-btn" :disabled="zoomLevel <= 1" @click="zoomOut">&#8722;</button>
            <button class="zoom-btn" :disabled="zoomLevel >= MAX_ZOOM" @click="zoomIn">&#43;</button>
            <span class="zoom-value">{{ zoomLevel.toFixed(1) }}x</span>
            <button class="zoom-reset-btn" @click="resetZoom">Reset</button>
          </div>

          <!-- Scrollable Gantt -->
          <div ref="ganttScrollRef" class="gantt-scroll-container" @wheel="onGanttWheel">
            <div class="gantt-container" :style="{ width: ganttWidth }">
              <!-- Timeline Axis (dynamic ticks) -->
              <div class="gantt-header">
                <div class="gantt-header-label" style="width: 150px"></div>
                <div class="gantt-axis">
                  <div
                    v-for="tick in axisTicks"
                    :key="tick.ms"
                    class="gantt-tick"
                    :style="{ left: (tick.ms / DAY_MS) * 100 + '%' }"
                  >
                    <span class="tick-label">{{ tick.label }}</span>
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
          </div>

          <!-- Summary Table -->
          <div class="summary-section">
            <h3 class="summary-title">Daily Usage Summary</h3>
            <table class="summary-table">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Sessions</th>
                  <th>Total Time</th>
                  <th>Usage %</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(machine, index) in data.machines" :key="'sum-' + machine.id">
                  <td>
                    <span class="machine-dot" :style="{ background: machineColor(machine.id, index) }"></span>
                    {{ machine.name }}
                  </td>
                  <td>{{ machine.sessions.length }}</td>
                  <td>{{ formatDuration(totalSeconds(machine.sessions)) }}</td>
                  <td>
                    <div class="usage-bar-cell">
                      <div class="usage-bar-bg">
                        <div
                          class="usage-bar-fill"
                          :style="{
                            width: usagePercent(machine.sessions) + '%',
                            background: machineColor(machine.id, index)
                          }"
                        ></div>
                      </div>
                      <span class="usage-pct-label">{{ usagePercent(machine.sessions).toFixed(1) }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="summary-total-row">
                  <td><strong>All Machines</strong></td>
                  <td><strong>{{ data.machines.reduce((a, m) => a + m.sessions.length, 0) }}</strong></td>
                  <td><strong>{{ formatDuration(data.machines.reduce((a, m) => a + totalSeconds(m.sessions), 0)) }}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
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

// ── Zoom
const MAX_ZOOM = 500
const DAY_MS = 24 * 60 * 60 * 1000
const BASE_WIDTH_PX = 800

const zoomLevel = ref(1)
const ganttScrollRef = ref<HTMLElement | null>(null)

const ganttWidth = computed(() => `${Math.round(BASE_WIDTH_PX * zoomLevel.value)}px`)

function zoomIn()  { zoomLevel.value = Math.min(MAX_ZOOM, +(zoomLevel.value * 1.25).toFixed(4)) }
function zoomOut() { zoomLevel.value = Math.max(1,        +(zoomLevel.value / 1.25).toFixed(4)) }
function resetZoom() { zoomLevel.value = 1 }

// Ctrl + scroll → zoom anchored on cursor; plain scroll → horizontal pan
function onGanttWheel(e: WheelEvent) {
  if (!e.ctrlKey) return   // let the browser handle normal vertical/horizontal scroll
  e.preventDefault()

  const container = ganttScrollRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const mouseX = e.clientX - rect.left          // px from left edge of container
  const oldWidth = container.scrollWidth        // current gantt track width
  const ratio = (container.scrollLeft + mouseX) / oldWidth  // fraction under cursor

  const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
  zoomLevel.value = Math.min(MAX_ZOOM, Math.max(1, +(zoomLevel.value * factor).toFixed(4)))

  nextTick(() => {
    if (!container) return
    const newWidth = container.scrollWidth
    container.scrollLeft = ratio * newWidth - mouseX
  })
}

// ── Dynamic axis ticks
// Pick the smallest "nice" interval (in ms) so ticks are ≥ 60px apart.
const TICK_INTERVALS_MS = [
  2 * 3600_000, 3600_000,          // 2h, 1h
  30 * 60_000, 15 * 60_000, 10 * 60_000, 5 * 60_000, 60_000, // 30m…1m
  30_000, 10_000, 5_000, 1_000,    // 30s, 10s, 5s, 1s
  500, 100, 50, 10, 5, 1,          // 500ms … 1ms
]

const axisTicks = computed(() => {
  const trackPx = BASE_WIDTH_PX * zoomLevel.value
  const pxPerMs = trackPx / DAY_MS

  // smallest interval where adjacent ticks are at least 60px apart
  const interval: number = TICK_INTERVALS_MS.find(iv => iv * pxPerMs >= 60) ?? 1

  const ticks: { ms: number; label: string }[] = []
  for (let ms = 0; ms <= DAY_MS; ms += interval) {
    ticks.push({ ms, label: formatTickMs(ms, interval) })
  }
  return ticks
})

function formatTickMs(ms: number, interval: number): string {
  const h  = Math.floor(ms / 3600_000)
  const m  = Math.floor((ms % 3600_000) / 60_000)
  const s  = Math.floor((ms % 60_000) / 1_000)
  const ms_ = ms % 1_000

  if (interval >= 60_000)   return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  if (interval >= 1_000)    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms_).padStart(3,'0')}`
}

// ── Format helpers
const formattedDate = computed(() => {
  if (!dateParam) return ''
  const [y, m, d] = dateParam.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

function formatTimeMs(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

function formatTooltip(start: string, end: string | null, isOngoing: boolean) {
  const dStart = new Date(start)
  const sStr = formatTimeMs(dStart)
  if (isOngoing || !end) return `Started: ${sStr}\nOngoing`
  const dEnd = new Date(end)
  const eStr = formatTimeMs(dEnd)
  const durMs = dEnd.getTime() - dStart.getTime()
  const durStr = durMs < 1000
    ? `${durMs}ms`
    : durMs < 60_000
      ? `${(durMs / 1000).toFixed(3)}s`
      : formatDuration(durMs / 1000)
  return `Started: ${sStr}\nEnded:   ${eStr}\nDuration: ${durStr}`
}

// ── Summary helpers
function totalSeconds(sessions: { durationSeconds: number }[]): number {
  return sessions.reduce((sum, s) => sum + s.durationSeconds, 0)
}

function usagePercent(sessions: { durationSeconds: number }[]): number {
  return Math.min(100, (totalSeconds(sessions) / (24 * 60 * 60)) * 100)
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
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

/* ── Zoom Controls ── */
.gantt-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  background: rgba(16, 38, 58, 0.4);
  border: 1px solid rgba(128, 176, 224, 0.15);
  border-radius: 8px;
  width: fit-content;
}

.zoom-hint {
  font-size: 0.75rem;
  opacity: 0.5;
  user-select: none;
  font-style: italic;
}

.zoom-btn {
  background: rgba(128, 176, 224, 0.15);
  border: 1px solid rgba(128, 176, 224, 0.25);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 1rem;
  width: 26px;
  height: 26px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  padding: 0;
}

.zoom-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-btn:not(:disabled):hover {
  background: rgba(128, 176, 224, 0.3);
}

.zoom-value {
  font-size: 0.8rem;
  font-weight: 700;
  min-width: 3rem;
  text-align: center;
  opacity: 0.9;
}

.zoom-reset-btn {
  background: transparent;
  border: 1px solid rgba(128, 176, 224, 0.2);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s, background 0.2s;
}

.zoom-reset-btn:hover {
  opacity: 1;
  background: rgba(128, 176, 224, 0.1);
}

/* ── Gantt Chart ── */
.gantt-scroll-container {
  overflow-x: auto;
  width: 100%;
}

.gantt-container {
  display: flex;
  flex-direction: column;
  padding-bottom: 0.5rem;
  min-width: 800px;
  transition: width 0.2s;
}

.gantt-header {
  display: flex;
  border-bottom: 1px solid rgba(128, 176, 224, 0.15);
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
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
  flex-shrink: 0;
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

/* ── Summary Table ── */
.summary-section {
  margin-top: 1rem;
  border-top: 1px solid rgba(128, 176, 224, 0.15);
  padding-top: 1rem;
}

.summary-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
  opacity: 0.85;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.summary-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.55;
  border-bottom: 1px solid rgba(128, 176, 224, 0.15);
}

.summary-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid rgba(128, 176, 224, 0.07);
  vertical-align: middle;
}

.summary-table td:first-child {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.summary-table tbody tr:hover td {
  background: rgba(128, 176, 224, 0.05);
}

.summary-total-row td {
  border-top: 1px solid rgba(128, 176, 224, 0.2);
  border-bottom: none;
  padding-top: 0.75rem;
}

.usage-bar-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.usage-bar-bg {
  flex: 1;
  height: 8px;
  background: rgba(128, 176, 224, 0.1);
  border-radius: 4px;
  overflow: hidden;
  max-width: 160px;
}

.usage-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.usage-pct-label {
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 3rem;
  opacity: 0.85;
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
  .zoom-controls {
    flex-wrap: wrap;
  }
}
</style>
