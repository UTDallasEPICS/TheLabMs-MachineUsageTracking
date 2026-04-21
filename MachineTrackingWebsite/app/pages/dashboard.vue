<template>
  <div class="dashboard">
    <!-- ── Header ── -->
    <div class="dashboard__header">
      <div>
        <h1 class="dashboard__title">Dashboard</h1>
        <p class="dashboard__subtitle">Monthly machine usage calendar</p>
      </div>
      <div class="actions-row">
        <span class="live-chip" v-if="formattedGeneratedAt">
          <span class="live-dot" aria-hidden="true"></span>
          Updated {{ formattedGeneratedAt }}
        </span>
        <button class="refresh-btn" @click="handleRefresh">Refresh</button>
      </div>
    </div>

    <div class="dashboard__grid">
      <!-- ── Calendar Card ── -->
      <Card>
        <template #title>
          <div class="cal-nav">
            <button class="cal-nav-btn" @click="prevMonth" aria-label="Previous month">&#8249;</button>
            <span class="cal-month-label">{{ monthLabel }}</span>
            <button class="cal-nav-btn" @click="nextMonth" aria-label="Next month">&#8250;</button>
          </div>
        </template>

        <template #stats>
          <div v-if="isInitialLoad" class="empty-state">Loading calendar data…</div>

          <div v-else-if="calError" class="empty-state">
            Could not load calendar data. Make sure the server is running.
          </div>

          <div v-else>
            <!-- Day-of-week headers -->
            <div class="cal-grid">
              <div
                v-for="d in DAY_LABELS"
                :key="d"
                class="cal-day-header"
              >{{ d }}</div>

              <!-- Filler cells before day 1 -->
              <div
                v-for="n in firstDayOfWeek"
                :key="'filler-' + n"
                class="cal-cell cal-cell--filler"
              ></div>

              <!-- Day cells -->
              <div
                v-for="day in calendarDays"
                :key="day.date"
                class="cal-cell cal-cell--clickable"
                :class="{ 'cal-cell--today': day.isToday }"
                @click="goToTimeline(day.date)"
              >
                <span class="cal-date-num">{{ day.dayNumber }}</span>
                <div class="cal-bar-group">
                  <div
                    v-for="m in day.machines"
                    :key="m.id"
                    class="cal-bar"
                    :style="{
                      height: barHeight(m.totalSeconds) + 'px',
                      background: machineColor(m.id),
                    }"
                    :title="`${m.name}: ${formatDuration(m.totalSeconds)}`"
                  ></div>
                </div>
                <div class="cal-machine-totals">
                  <span
                    v-for="m in day.machines.filter(m => m.totalSeconds > 0)"
                    :key="m.id"
                    class="cal-machine-total"
                    :style="{ color: machineColor(m.id) }"
                  >{{ formatDurationShort(m.totalSeconds) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- ── Range Totals Card ── -->
      <Card>
        <template #title>
          <h2 class="card-title">Machine Totals</h2>
        </template>

        <template #stats>
          <div class="range-controls">
            <label class="range-field">
              <span class="range-label">Range</span>
              <select v-model="rangePreset" class="range-select">
                <option value="viewed_month">Viewed month</option>
                <option value="last_7_days">Last 7 days</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            <label v-if="rangePreset === 'custom'" class="range-field">
              <span class="range-label">Start</span>
              <input v-model="customRangeStart" type="date" class="range-input" />
            </label>

            <label v-if="rangePreset === 'custom'" class="range-field">
              <span class="range-label">End</span>
              <input v-model="customRangeEnd" type="date" class="range-input" />
            </label>
          </div>

          <div class="range-summary">
            <span v-if="effectiveRange" class="range-dates">
              {{ effectiveRange.start }} to {{ effectiveRange.end }}
            </span>
            <span v-if="!effectiveRange" class="empty-state">
              Select valid start and end dates.
            </span>
            <span v-if="effectiveRange" class="range-total">
              Total: {{ formatDuration(rangeGrandTotalSeconds) }}
            </span>
          </div>

          <div v-if="rangeTotalsPending && !rangeTotalsData" class="empty-state">
            Loading totals...
          </div>
          <div v-else-if="rangeTotalsError" class="empty-state">
            Could not load range totals.
          </div>
          <div v-else-if="!rangeMachines.length" class="empty-state">
            No machines in this range.
          </div>
          <div v-else class="range-list">
            <div v-for="machine in rangeMachines" :key="machine.id" class="range-row">
              <div class="range-row-main">
                <span class="chip-dot" :style="{ background: machineColor(machine.id) }"></span>
                <span class="range-machine-name">{{ machine.name }}</span>
              </div>
              <span class="range-machine-time">{{ formatDuration(machine.totalSeconds) }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- ── Machine Filter Card ── -->
      <Card>
        <template #title>
          <h2 class="card-title">Machines</h2>
        </template>

        <template #stats>
          <div v-if="!allMachines.length" class="empty-state">No machines found.</div>
          <div v-else>
            <div class="filter-row">
              <button
                v-for="m in allMachines"
                :key="m.id"
                class="machine-chip"
                :class="{ 'machine-chip--active': visibleMachineIds.has(m.id) }"
                :style="visibleMachineIds.has(m.id) ? { borderColor: machineColor(m.id), color: machineColor(m.id) } : {}"
                @click="toggleMachine(m.id)"
              >
                <span class="chip-dot" :style="{ background: machineColor(m.id) }"></span>
                {{ m.name }}
              </button>
            </div>
            <div v-if="activeSessions.length" class="active-sessions">
              <div
                v-for="s in activeSessions"
                :key="s.id"
                class="active-session-row"
              >
                <span class="live-dot" aria-hidden="true"></span>
                <span class="active-session-name" :style="{ color: machineColor(s.id) }">{{ s.name }}</span>
                <span class="active-session-timer">{{ liveTimers[s.id] ?? '0h 0m 0s' }}</span>
              </div>
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

// ── Types ────────────────────────────────────────────────────
type CalendarDay = { date: string; totalSeconds: number }
type CalendarMachine = { id: number; name: string; days: CalendarDay[] }
type CalendarResponse = { year: number; month: number; machines: CalendarMachine[] }
type RangeMachineTotal = { id: number; name: string; totalSeconds: number }
type RangeTotalsResponse = { startDate: string; endDate: string; machines: RangeMachineTotal[] }

// ── Date state ───────────────────────────────────────────────
const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1) // 1-indexed

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MACHINE_COLORS = [
  '#80b0e0',
  '#e0405a',
  '#50c878',
  '#f0a030',
  '#a880e0',
  '#40c8c8',
  '#e08050',
]

// ── Fetch ────────────────────────────────────────────────────
const { data, pending: calPending, error: calError, refresh } = await useFetch<CalendarResponse>(
  '/api/microcontroller/calendar',
  {
    server: false,
    lazy: true,
    immediate: true,
    query: computed(() => ({ year: selectedYear.value, month: selectedMonth.value })),
  },
)

const isInitialLoad = computed(() => calPending.value && !data.value)
const formattedGeneratedAt = computed(() => new Date().toLocaleTimeString())

// ── Range totals ────────────────────────────────────────────
const rangePreset = ref<'viewed_month' | 'last_7_days' | 'last_30_days' | 'custom'>('viewed_month')
const customRangeStart = ref('')
const customRangeEnd = ref('')

type DateRange = { start: string; end: string }

function formatDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const effectiveRange = computed<DateRange | null>(() => {
  const today = new Date()

  if (rangePreset.value === 'viewed_month') {
    const start = new Date(selectedYear.value, selectedMonth.value - 1, 1)
    const end = new Date(selectedYear.value, selectedMonth.value, 0)
    return { start: formatDateInput(start), end: formatDateInput(end) }
  }

  if (rangePreset.value === 'last_7_days') {
    const end = new Date(today)
    const start = new Date(today)
    start.setDate(start.getDate() - 6)
    return { start: formatDateInput(start), end: formatDateInput(end) }
  }

  if (rangePreset.value === 'last_30_days') {
    const end = new Date(today)
    const start = new Date(today)
    start.setDate(start.getDate() - 29)
    return { start: formatDateInput(start), end: formatDateInput(end) }
  }

  if (!customRangeStart.value || !customRangeEnd.value) return null
  if (customRangeStart.value > customRangeEnd.value) return null

  return {
    start: customRangeStart.value,
    end: customRangeEnd.value,
  }
})

const { data: rangeTotalsData, pending: rangeTotalsPending, error: rangeTotalsError, refresh: refreshRangeTotals } = await useFetch<RangeTotalsResponse>(
  '/api/microcontroller/range-totals',
  {
    server: false,
    lazy: true,
    immediate: false,
    query: computed(() => {
      if (!effectiveRange.value) return {}
      return {
        start: effectiveRange.value.start,
        end: effectiveRange.value.end,
      }
    }),
  },
)

watch(effectiveRange, (range) => {
  if (!range) return
  refreshRangeTotals()
}, { immediate: true })

const rangeMachines = computed(() => {
  const machineTotals = new Map((rangeTotalsData.value?.machines ?? []).map((m) => [m.id, m.totalSeconds]))

  return allMachines.value
    .filter((m) => visibleMachineIds.value.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      totalSeconds: machineTotals.get(m.id) ?? 0,
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
})

const rangeGrandTotalSeconds = computed(() =>
  rangeMachines.value.reduce((acc, machine) => acc + machine.totalSeconds, 0)
)

// ── Active sessions (live timers) ────────────────────────────
type ActiveSession = { id: number; name: string; startedAt: string }

const { data: activeData, refresh: refreshActive } = await useFetch<ActiveSession[]>(
  '/api/microcontroller/active',
  { server: false, lazy: true, immediate: true },
)

const activeSessions = computed(() => activeData.value ?? [])

const liveTimers = ref<Record<number, string>>({})

function updateTimers() {
  const now = Date.now()
  const updated: Record<number, string> = {}
  for (const s of activeSessions.value) {
    const elapsedSeconds = Math.max(0, Math.floor((now - new Date(s.startedAt).getTime()) / 1000))
    updated[s.id] = formatDuration(elapsedSeconds)
  }
  liveTimers.value = updated
}

let timerInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateTimers()
  timerInterval = setInterval(updateTimers, 1000)
})

onUnmounted(() => {
  if (timerInterval !== null) clearInterval(timerInterval)
})

// Also refresh active sessions when the calendar refreshes
watch(data, () => refreshActive())

function handleRefresh() {
  refresh()
  refreshActive()
  if (effectiveRange.value) refreshRangeTotals()
}

// ── Navigation ───────────────────────────────────────────────
function goToTimeline(dateStr: string) {
  navigateTo(`/timeline/${dateStr}`)
}

// ── Month navigation ─────────────────────────────────────────
const monthLabel = computed(() => {
  return new Date(selectedYear.value, selectedMonth.value - 1, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' })
})

function prevMonth() {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

function nextMonth() {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}

// ── Machine data & filter ────────────────────────────────────
const allMachines = computed<{ id: number; name: string }[]>(() =>
  (data.value?.machines ?? []).map((m) => ({ id: m.id, name: m.name }))
)

const visibleMachineIds = ref<Set<number>>(new Set())

// Sync visible set when machine list changes (e.g. first load)
watch(allMachines, (machines) => {
  machines.forEach((m) => {
    if (!visibleMachineIds.value.has(m.id)) {
      visibleMachineIds.value = new Set([...visibleMachineIds.value, m.id])
    }
  })
}, { immediate: true })

function toggleMachine(id: number) {
  const next = new Set(visibleMachineIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  visibleMachineIds.value = next
}

function machineColor(id: number): string {
  const idx = (data.value?.machines ?? []).findIndex((m) => m.id === id)
  return MACHINE_COLORS[idx % MACHINE_COLORS.length] ?? '#80b0e0'
}

// ── Calendar grid helpers ────────────────────────────────────
const daysInMonth = computed(() =>
  new Date(selectedYear.value, selectedMonth.value, 0).getDate()
)

// 0 = Sunday
const firstDayOfWeek = computed(() =>
  new Date(selectedYear.value, selectedMonth.value - 1, 1).getDay()
)

const maxSecondsInMonth = computed(() => {
  let max = 0
  for (let d = 0; d < daysInMonth.value; d++) {
    let dayTotal = 0
    for (const m of data.value?.machines ?? []) {
      if (visibleMachineIds.value.has(m.id)) {
        dayTotal += m.days[d]?.totalSeconds ?? 0
      }
    }
    if (dayTotal > max) max = dayTotal
  }
  return max
})

const BAR_MAX_PX = 36

function barHeight(seconds: number): number {
  if (!maxSecondsInMonth.value) return 0
  return Math.max(2, Math.round((seconds / maxSecondsInMonth.value) * BAR_MAX_PX))
}

const todayStr = computed(() => {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
})

const calendarDays = computed(() => {
  return Array.from({ length: daysInMonth.value }, (_, i) => {
    const dayNum = i + 1
    const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`

    const machines = (data.value?.machines ?? [])
      .filter((m) => visibleMachineIds.value.has(m.id))
      .map((m) => ({ id: m.id, name: m.name, totalSeconds: m.days[i]?.totalSeconds ?? 0 }))

    const totalSeconds = machines.reduce((acc, m) => acc + m.totalSeconds, 0)

    return { dayNumber: dayNum, date: dateStr, isToday: dateStr === todayStr.value, machines, totalSeconds }
  })
})

// ── Formatting ───────────────────────────────────────────────
function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}h ${m}m ${sec}s`
}

function formatDurationShort(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}
</script>

<style scoped>
/* ── Layout ── */
.dashboard {
  padding: 2rem;
  max-width: 1100px;
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

/* ── Live chip / refresh ── */
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

/* ── Card title / nav ── */
.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.cal-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cal-month-label {
  font-size: 1.1rem;
  font-weight: 700;
  min-width: 11rem;
  text-align: center;
}

.cal-nav-btn {
  background: transparent;
  border: 1px solid rgba(128, 176, 224, 0.25);
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  color: inherit;
  line-height: 1;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.cal-nav-btn:hover {
  background: rgba(128, 176, 224, 0.12);
  border-color: rgba(128, 176, 224, 0.45);
}

/* ── Calendar Grid ── */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cal-day-header {
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.45;
  padding: 0.25rem 0 0.5rem;
}

.cal-cell--filler {
  background: transparent;
  pointer-events: none;
}

.cal-cell {
  min-height: 80px;
  background: rgba(16, 38, 58, 0.45);
  border: 1px solid rgba(128, 176, 224, 0.1);
  border-radius: 8px;
  padding: 0.4rem 0.3rem 0.35rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  transition: border-color 0.18s ease, background 0.18s ease;
  overflow: hidden;
}

.cal-cell--clickable {
  cursor: pointer;
}

.cal-cell:hover {
  border-color: rgba(128, 176, 224, 0.28);
  background: rgba(16, 38, 58, 0.7);
}

.cal-cell--today {
  border-color: rgba(128, 176, 224, 0.55);
  background: rgba(128, 176, 224, 0.09);
}

.cal-date-num {
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.6;
  line-height: 1;
  align-self: flex-start;
}

.cal-cell--today .cal-date-num {
  opacity: 1;
  color: var(--primary-color, #80b0e0);
}

.cal-bar-group {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  flex: 1;
  width: 100%;
  justify-content: center;
}

.cal-bar {
  width: 8px;
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  transition: height 0.3s ease;
  flex-shrink: 0;
}

.cal-machine-totals {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  width: 100%;
}

.cal-machine-total {
  font-size: 0.58rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

/* ── Machine filter ── */
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.machine-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem 0.35rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(128, 176, 224, 0.2);
  background: rgba(16, 38, 58, 0.5);
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}

.machine-chip:hover {
  background: rgba(128, 176, 224, 0.08);
}

.machine-chip--active {
  color: inherit;
  background: rgba(128, 176, 224, 0.06);
}

.chip-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.empty-state {
  padding: 0.5rem 0;
  opacity: 0.8;
}

/* ── Range totals ── */
.range-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.range-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.range-label {
  font-size: 0.72rem;
  opacity: 0.65;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.range-select,
.range-input {
  min-height: 2.1rem;
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(128, 176, 224, 0.2);
  background: rgba(16, 38, 58, 0.55);
  color: inherit;
  font: inherit;
}

.range-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
  border-top: 1px solid rgba(128, 176, 224, 0.12);
  border-bottom: 1px solid rgba(128, 176, 224, 0.12);
  padding: 0.55rem 0;
}

.range-dates {
  font-size: 0.84rem;
  opacity: 0.82;
}

.range-total {
  font-size: 0.88rem;
  font-weight: 700;
}

.range-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.range-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  background: rgba(16, 38, 58, 0.42);
  border: 1px solid rgba(128, 176, 224, 0.08);
}

.range-row-main {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.range-machine-name {
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.range-machine-time {
  font-size: 0.84rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.88;
}

/* ── Active session timers ── */
.active-sessions {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid rgba(128, 176, 224, 0.12);
  padding-top: 0.65rem;
}

.active-session-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.active-session-name {
  font-weight: 600;
  min-width: 6rem;
}

.active-session-timer {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

/* ── Responsive ── */
@media (max-width: 640px) {
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

  .cal-cell {
    min-height: 60px;
    padding: 0.25rem 0.15rem;
  }

  .cal-bar {
    width: 5px;
  }

  .cal-month-label {
    min-width: 8rem;
    font-size: 0.95rem;
  }

  .range-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}

/* ── Animations ── */
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(128, 176, 224, 0.62); }
  70% { box-shadow: 0 0 0 8px rgba(128, 176, 224, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
}
</style>
