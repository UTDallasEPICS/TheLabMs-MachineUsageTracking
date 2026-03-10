<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

type PendingUser = {
  id: string
  email: string
  requested_at: string
}

type UserRecord = {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

type MicrocontrollerRecord = {
  id: number
  name: string
  api_key: string
  created_at: string
  _count: {
    sensor_data: number
    usage_sessions: number
  }
}

type AdminInfoResponse = {
  admin: {
    id: string
    email: string
    role: 'admin'
    created_at: string
  }
  stats: {
    pendingRequests: number
    machineCount: number
  }
}

type NewMachineResponse = {
  id: number
  name: string
  api_key: string
}

type DirectoryView = 'microcontrollers' | 'users' | 'pending'

const { data: me, refresh: refreshMe } = await useFetch<AdminInfoResponse>('/api/admin/me')
const { data: pending, refresh: refreshPending } = await useFetch<PendingUser[]>('/api/admin/pending')
const { data: users, refresh: refreshUsers } = await useFetch<UserRecord[]>('/api/admin/users')
const { data: microcontrollers, refresh: refreshMicrocontrollers } = await useFetch<MicrocontrollerRecord[]>('/api/admin/microcontrollers')

const newMcName = ref('')
const newMcApiKey = ref('')
const useCustomApiKey = ref(false)
const newMachine = ref<NewMachineResponse | null>(null)
const pageError = ref('')
const pageSuccess = ref('')
const directoryView = ref<DirectoryView>('microcontrollers')
const userSearch = ref('')

const filteredUsers = computed(() => {
  const list = (users.value ?? []).filter((account) => account.role === 'user')
  const query = userSearch.value.trim().toLowerCase()
  if (!query) return list
  return list.filter((account) => account.email.toLowerCase().includes(query))
})

async function refreshAll() {
  await Promise.all([refreshMe(), refreshPending(), refreshUsers(), refreshMicrocontrollers()])
}

async function approve(id: string) {
  pageError.value = ''
  pageSuccess.value = ''
  try {
    await $fetch('/api/admin/approve', { method: 'POST', body: { id } })
    await refreshAll()
    pageSuccess.value = 'User approved successfully.'
  } catch {
    pageError.value = 'Could not approve user.'
  }
}

async function deny(id: string) {
  pageError.value = ''
  pageSuccess.value = ''
  try {
    await $fetch('/api/admin/deny', { method: 'POST', body: { id } })
    await refreshAll()
    pageSuccess.value = 'Pending request denied.'
  } catch {
    pageError.value = 'Could not deny user.'
  }
}

async function registerMicrocontroller() {
  if (!newMcName.value.trim()) return
  if (useCustomApiKey.value && !newMcApiKey.value.trim()) {
    pageError.value = 'Custom API key cannot be empty.'
    return
  }

  pageError.value = ''
  pageSuccess.value = ''
  try {
    const result = await $fetch<NewMachineResponse>('/api/admin/microcontroller', {
      method: 'POST',
      body: {
        name: newMcName.value.trim(),
        apiKey: useCustomApiKey.value ? newMcApiKey.value.trim() : undefined
      }
    })

    newMachine.value = result
    newMcName.value = ''
    newMcApiKey.value = ''
    useCustomApiKey.value = false
    await refreshMe()
    await refreshMicrocontrollers()
    pageSuccess.value = 'Microcontroller registered.'
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    pageError.value = message || 'Failed to register microcontroller.'
  }
}

function generateRandomApiKey() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  newMcApiKey.value = Array.from({ length: 16 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  useCustomApiKey.value = true
}

async function removeMicrocontroller(id: number, name: string) {
  if (!confirm(`Remove microcontroller "${name}" and all related data?`)) return

  pageError.value = ''
  pageSuccess.value = ''
  try {
    await $fetch('/api/admin/microcontroller', {
      method: 'DELETE',
      body: { id }
    })
    await refreshAll()
    pageSuccess.value = `Microcontroller "${name}" removed.`
  } catch {
    pageError.value = 'Failed to remove microcontroller.'
  }
}

async function removeUser(id: string, email: string) {
  if (!confirm(`Remove user account "${email}"?`)) return

  pageError.value = ''
  pageSuccess.value = ''
  try {
    await $fetch('/api/admin/user', {
      method: 'DELETE',
      body: { id }
    })
    await refreshAll()
    pageSuccess.value = `User account "${email}" removed.`
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    pageError.value = message || 'Failed to remove user.'
  }
}

</script>

<template>
  <div class="admin-dashboard">
    <div class="admin-dashboard__header">
      <div>
        <h1>Admin Dashboard</h1>
        <p>Review requests, approve users, and manage microcontrollers.</p>
      </div>
    </div>

    <div class="admin-overview">
      <article class="overview-card">
        <span class="overview-card__label">Admin Email</span>
        <strong>{{ me?.admin.email || '-' }}</strong>
      </article>
      <article class="overview-card">
        <span class="overview-card__label">Role</span>
        <strong>{{ me?.admin.role || '-' }}</strong>
      </article>
      <article class="overview-card">
        <span class="overview-card__label">Pending Requests</span>
        <strong>{{ me?.stats.pendingRequests ?? 0 }}</strong>
      </article>
      <article class="overview-card">
        <span class="overview-card__label">Registered Machines</span>
        <strong>{{ me?.stats.machineCount ?? 0 }}</strong>
      </article>
    </div>

    <div class="admin-layout">
      <section class="admin-panel admin-panel--span2">
        <div class="admin-panel__head">
          <div>
            <h2>Directory View</h2>
            <p class="admin-panel__subtext">Pick which records you want to manage.</p>
          </div>
          <NuxtLink to="/admin/change-password" class="admin-link-btn">Change Password</NuxtLink>
        </div>
        <div class="view-select">
          <label for="directory-view">Current section</label>
          <div class="view-select__field">
            <select id="directory-view" v-model="directoryView">
              <option value="microcontrollers">Microcontrollers</option>
              <option value="users">Users</option>
              <option value="pending">Pending Signups</option>
            </select>
          </div>
        </div>
      </section>

      <section v-if="directoryView === 'pending'" class="admin-panel admin-panel--span2">
        <h2>Pending Signups</h2>
        <p v-if="!pending?.length">No pending requests.</p>

        <div v-for="user in pending" :key="user.id" class="pending-item">
          <div>
            <p><strong>{{ user.email }}</strong></p>
            <p class="pending-item__meta">Requested: {{ new Date(user.requested_at).toLocaleString() }}</p>
          </div>
          <div class="pending-item__actions">
            <button @click="approve(user.id)">Approve</button>
            <button class="danger" @click="deny(user.id)">Deny</button>
          </div>
        </div>
      </section>

      <section v-if="directoryView === 'microcontrollers'" class="admin-panel admin-panel--span2">
        <h2>Registered Microcontrollers</h2>
        <div class="admin-panel__inline">
          <input v-model="newMcName" type="text" placeholder="Microcontroller name" />
          <button @click="registerMicrocontroller">Register</button>
        </div>
        <div class="admin-panel__inline">
          <label class="inline-check inline-check--toggle">
            <input v-model="useCustomApiKey" type="checkbox" class="inline-check__input" />
            <span class="inline-check__box" aria-hidden="true"></span>
            <span class="inline-check__label">Set custom API key</span>
          </label>
          <input
            v-model="newMcApiKey"
            :disabled="!useCustomApiKey"
            type="text"
            placeholder="Custom API key"
          />
          <button @click="generateRandomApiKey">Generate Random 16-char Key</button>
        </div>

        <div v-if="newMachine" class="api-key-box">
          <p>Copy this API key.</p>
          <code>{{ newMachine.api_key }}</code>
        </div>

        <p v-if="!microcontrollers?.length">No microcontrollers registered.</p>

        <div v-for="mc in microcontrollers" :key="mc.id" class="pending-item">
          <div>
            <p><strong>{{ mc.name }}</strong></p>
            <p class="pending-item__meta">Signals: {{ mc._count.sensor_data }} | Sessions: {{ mc._count.usage_sessions }}</p>
            <p class="pending-item__meta">Key: <code>{{ mc.api_key }}</code></p>
          </div>
          <div class="pending-item__actions">
            <button class="danger" @click="removeMicrocontroller(mc.id, mc.name)">Remove</button>
          </div>
      </div>
      </section>

      <section v-if="directoryView === 'users'" class="admin-panel admin-panel--span2">
        <h2>User Accounts</h2>
        <div class="admin-panel__inline">
          <input v-model="userSearch" type="text" placeholder="Search users by email" />
        </div>
        <p v-if="!filteredUsers.length && !userSearch.trim()">No users found.</p>
        <p v-else-if="!filteredUsers.length">No users match "{{ userSearch }}".</p>

        <div class="users-grid">
          <div v-for="account in filteredUsers" :key="account.id" class="pending-item pending-item--card">
            <div>
              <p>
                <strong>{{ account.email }}</strong>
                <span class="role-badge" :class="account.role">{{ account.role }}</span>
              </p>
              <p class="pending-item__meta">Created: {{ new Date(account.created_at).toLocaleString() }}</p>
            </div>
            <div class="pending-item__actions">
              <button class="danger" @click="removeUser(account.id, account.email)">Remove Account</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <p v-if="pageError" class="page-error">{{ pageError }}</p>
    <p v-if="pageSuccess" class="page-success">{{ pageSuccess }}</p>
  </div>
</template>

<style scoped>
.admin-dashboard {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.2rem;
  display: grid;
  gap: 1rem;
}

.admin-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
}

.overview-card {
  border: 1px solid rgba(128, 176, 224, 0.2);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  background: rgba(8, 23, 40, 0.6);
  display: grid;
  gap: 0.15rem;
}

.overview-card__label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.overview-card strong {
  font-size: 0.95rem;
  line-height: 1.2;
}

.overview-card:hover {
  border-color: rgba(128, 176, 224, 0.35);
  background: rgba(10, 27, 46, 0.72);
  box-shadow:
    0 0 0 1px rgba(128, 176, 224, 0.12),
    0 4px 12px rgba(2, 6, 23, 0.16);
}

.admin-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.admin-panel--span2 {
  grid-column: span 2;
}

.admin-dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  position: relative;
  padding-bottom: 0.4rem;
}

.admin-dashboard__header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(128, 176, 224, 0.56), rgba(224, 16, 64, 0));
}

.admin-dashboard__header h1 {
  margin: 0;
}

.admin-panel {
  border: 1px solid rgba(128, 176, 224, 0.2);
  border-radius: 12px;
  padding: 1rem;
  background: rgba(8, 23, 40, 0.68);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.admin-panel:hover {
  border-color: rgba(128, 176, 224, 0.3);
  background: rgba(10, 27, 46, 0.76);
  box-shadow:
    0 0 0 1px rgba(128, 176, 224, 0.12),
    0 0 18px rgba(128, 176, 224, 0.1),
    0 6px 16px rgba(2, 6, 23, 0.16);
}

.admin-panel h2 {
  margin-bottom: 0.45rem;
  background: linear-gradient(90deg, #eaf4ff, #80b0e0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.admin-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
}

.admin-panel__subtext {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.admin-link-btn {
  border: 1px solid rgba(128, 176, 224, 0.35);
  border-radius: 10px;
  padding: 0.45rem 0.72rem;
  color: var(--text-primary);
  background: linear-gradient(145deg, rgba(128, 176, 224, 0.2), rgba(128, 176, 224, 0.08));
  font-size: 0.86rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.admin-link-btn:hover {
  filter: brightness(1.06);
  border-color: rgba(128, 176, 224, 0.55);
  box-shadow: 0 0 0 1px rgba(128, 176, 224, 0.12);
}

.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.55rem 0;
  border-top: 1px solid rgba(128, 176, 224, 0.2);
}

.pending-item__meta {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.55rem;
}

.pending-item--card {
  border: 1px solid rgba(128, 176, 224, 0.2);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  background: rgba(8, 23, 40, 0.46);
}

.pending-item__actions {
  display: flex;
  gap: 0.5rem;
}

.pending-item__actions button,
.admin-panel__inline button {
  border: 1px solid rgba(128, 176, 224, 0.28);
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  color: var(--text-primary);
  background: linear-gradient(145deg, rgba(128, 176, 224, 0.22), rgba(128, 176, 224, 0.1));
  cursor: pointer;
  transition: filter 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.pending-item__actions button:hover,
.admin-panel__inline button:hover {
  filter: brightness(1.06);
  border-color: rgba(128, 176, 224, 0.45);
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.25), 0 0 0 1px rgba(128, 176, 224, 0.12);
}

.pending-item__actions .danger {
  border-color: rgba(224, 16, 64, 0.42);
  background: linear-gradient(145deg, rgba(224, 16, 64, 0.3), rgba(224, 16, 64, 0.14));
  color: var(--text-primary);
}

.pending-item__actions .danger:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.admin-panel__inline {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.view-select {
  margin-top: 0.55rem;
  display: grid;
  gap: 0.35rem;
  width: min(360px, 100%);
}

.view-select label {
  color: var(--primary-hover);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 600;
}

.view-select__field {
  position: relative;
}

.view-select__field::after {
  content: '▾';
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-52%);
  color: var(--primary-color);
  pointer-events: none;
}

.view-select select {
  width: 100%;
  appearance: none;
  border: 1px solid rgba(128, 176, 224, 0.45);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(8, 23, 40, 0.9), rgba(16, 38, 58, 0.86));
  color: #f4f9ff;
  padding: 0.62rem 2rem 0.62rem 0.72rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.view-select select option {
  background: #10263a;
  color: #eef6ff;
}

.view-select select:focus {
  outline: none;
  border-color: rgba(128, 176, 224, 0.7);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.admin-panel__inline input {
  min-width: 240px;
  flex: 1;
  border: 1px solid rgba(128, 176, 224, 0.35);
  border-radius: 8px;
  background: rgba(8, 23, 40, 0.9);
  color: var(--text-primary);
  padding: 0.5rem 0.65rem;
}

.admin-panel__inline input:disabled {
  opacity: 0.6;
}

.inline-check {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.inline-check--toggle {
  border: 1px solid rgba(128, 176, 224, 0.32);
  border-radius: 999px;
  padding: 0.45rem 0.7rem;
  background: rgba(8, 23, 40, 0.8);
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  user-select: none;
}

.inline-check--toggle:hover {
  border-color: rgba(128, 176, 224, 0.5);
  background: rgba(16, 38, 58, 0.72);
  box-shadow: 0 0 0 1px rgba(128, 176, 224, 0.12);
}

.inline-check__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.inline-check__box {
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 0.3rem;
  border: 1px solid rgba(128, 176, 224, 0.5);
  background: rgba(8, 23, 40, 0.92);
  display: inline-grid;
  place-items: center;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.inline-check__box::after {
  content: '';
  width: 0.56rem;
  height: 0.32rem;
  border-left: 2px solid transparent;
  border-bottom: 2px solid transparent;
  transform: rotate(-45deg) translate(0.01rem, -0.05rem);
  transition: border-color 0.18s ease;
}

.inline-check__label {
  color: #e8f3ff;
  font-weight: 500;
}

.inline-check__input:checked + .inline-check__box {
  border-color: rgba(128, 176, 224, 0.8);
  background: linear-gradient(145deg, rgba(128, 176, 224, 0.32), rgba(128, 176, 224, 0.14));
  box-shadow: 0 0 0 1px rgba(128, 176, 224, 0.18);
}

.inline-check__input:checked + .inline-check__box::after {
  border-left-color: #ecf6ff;
  border-bottom-color: #ecf6ff;
}

.inline-check__input:focus-visible + .inline-check__box {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.api-key-box {
  margin-top: 0.8rem;
  background: rgba(128, 176, 224, 0.12);
  border: 1px solid rgba(128, 176, 224, 0.4);
  border-radius: 8px;
  padding: 0.75rem;
}

.api-key-box code {
  display: block;
  margin-top: 0.35rem;
  overflow-wrap: anywhere;
}

.role-badge {
  margin-left: 0.45rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.role-badge.admin {
  background: rgba(128, 176, 224, 0.2);
  color: var(--primary-color);
}

.role-badge.user {
  background: rgba(224, 16, 64, 0.16);
  color: var(--secondary-color);
}

.page-error {
  color: var(--secondary-color);
}

.page-success {
  color: var(--primary-hover);
}

@media (max-width: 640px) {
  .admin-overview {
    grid-template-columns: 1fr 1fr;
  }

  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-panel--span2 {
    grid-column: auto;
  }

  .admin-dashboard__header {
    flex-direction: column;
  }

  .admin-panel__head {
    flex-direction: column;
  }

  .pending-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .users-grid {
    grid-template-columns: 1fr;
  }
}
</style>
