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

const { data: me, refresh: refreshMe } = await useFetch<AdminInfoResponse>('/api/admin/me')
const { data: pending, refresh: refreshPending } = await useFetch<PendingUser[]>('/api/admin/pending')
const { data: users, refresh: refreshUsers } = await useFetch<UserRecord[]>('/api/admin/users')
const { data: microcontrollers, refresh: refreshMicrocontrollers } = await useFetch<MicrocontrollerRecord[]>('/api/admin/microcontrollers')

const newMcName = ref('')
const newMachine = ref<NewMachineResponse | null>(null)
const pageError = ref('')
const pageSuccess = ref('')

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

  pageError.value = ''
  pageSuccess.value = ''
  try {
    const result = await $fetch<NewMachineResponse>('/api/admin/microcontroller', {
      method: 'POST',
      body: { name: newMcName.value.trim() }
    })

    newMachine.value = result
    newMcName.value = ''
    await refreshMe()
    await refreshMicrocontrollers()
    pageSuccess.value = 'Microcontroller registered.'
  } catch {
    pageError.value = 'Failed to register microcontroller.'
  }
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

async function logoutAdmin() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="admin-dashboard">
    <div class="admin-dashboard__header">
      <div>
        <h1>Admin Dashboard</h1>
        <p>Review requests, approve users, and manage microcontrollers.</p>
      </div>
      <button class="admin-dashboard__logout" @click="logoutAdmin">Logout</button>
    </div>

    <section class="admin-panel">
      <h2>Admin Information</h2>
      <p><strong>Email:</strong> {{ me?.admin.email || '-' }}</p>
      <p><strong>Role:</strong> {{ me?.admin.role || '-' }}</p>
      <p>
        <strong>Created:</strong>
        {{ me?.admin.created_at ? new Date(me.admin.created_at).toLocaleString() : '-' }}
      </p>
      <p><strong>Pending Requests:</strong> {{ me?.stats.pendingRequests ?? 0 }}</p>
      <p><strong>Registered Machines:</strong> {{ me?.stats.machineCount ?? 0 }}</p>
    </section>

    <section class="admin-panel">
      <h2>Pending Signups</h2>
      <p v-if="!pending?.length">No pending requests.</p>

      <div v-for="user in pending" :key="user.id" class="pending-item">
        <div>
          <p><strong>{{ user.email }}</strong></p>
          <p>Requested: {{ new Date(user.requested_at).toLocaleString() }}</p>
        </div>
        <div class="pending-item__actions">
          <button @click="approve(user.id)">Approve</button>
          <button class="danger" @click="deny(user.id)">Deny</button>
        </div>
      </div>
    </section>

    <section class="admin-panel">
      <h2>Register New ESP-32</h2>
      <div class="admin-panel__inline">
        <input v-model="newMcName" type="text" placeholder="Microcontroller name" />
        <button @click="registerMicrocontroller">Register</button>
      </div>

      <div v-if="newMachine" class="api-key-box">
        <p>Copy this API key now. It is only shown once.</p>
        <code>{{ newMachine.api_key }}</code>
      </div>
    </section>

    <section class="admin-panel">
      <h2>Registered Microcontrollers</h2>
      <p v-if="!microcontrollers?.length">No microcontrollers registered.</p>

      <div v-for="mc in microcontrollers" :key="mc.id" class="pending-item">
        <div>
          <p><strong>{{ mc.name }}</strong> (ID {{ mc.id }})</p>
          <p>API key: <code>{{ mc.api_key }}</code></p>
          <p>Signals: {{ mc._count.sensor_data }} | Sessions: {{ mc._count.usage_sessions }}</p>
        </div>
        <div class="pending-item__actions">
          <button class="danger" @click="removeMicrocontroller(mc.id, mc.name)">Remove</button>
        </div>
      </div>
    </section>

    <section class="admin-panel">
      <h2>All Users</h2>
      <p v-if="!users?.length">No users found.</p>

      <div v-for="account in users" :key="account.id" class="pending-item">
        <div>
          <p>
            <strong>{{ account.email }}</strong>
            <span class="role-badge" :class="account.role">{{ account.role }}</span>
          </p>
          <p>Created: {{ new Date(account.created_at).toLocaleString() }}</p>
        </div>
        <div class="pending-item__actions">
          <button
            class="danger"
            :disabled="account.id === me?.admin.id"
            @click="removeUser(account.id, account.email)"
          >
            Remove Account
          </button>
        </div>
      </div>
    </section>

    <p v-if="pageError" class="page-error">{{ pageError }}</p>
    <p v-if="pageSuccess" class="page-success">{{ pageSuccess }}</p>
  </div>
</template>

<style scoped>
.admin-dashboard {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.2rem;
  display: grid;
  gap: 1rem;
}

.admin-dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.admin-dashboard__header h1 {
  margin: 0;
}

.admin-dashboard__logout {
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: transparent;
  color: inherit;
  border-radius: 10px;
  padding: 0.55rem 0.8rem;
  cursor: pointer;
}

.admin-panel {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.55);
}

.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 0;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.pending-item__actions {
  display: flex;
  gap: 0.5rem;
}

.pending-item__actions button,
.admin-panel__inline button {
  border: 0;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
}

.pending-item__actions .danger {
  background: #7f1d1d;
  color: #fee2e2;
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

.admin-panel__inline input {
  min-width: 240px;
  flex: 1;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.85);
  color: #e2e8f0;
  padding: 0.5rem 0.65rem;
}

.api-key-box {
  margin-top: 0.8rem;
  background: rgba(2, 132, 199, 0.12);
  border: 1px solid rgba(125, 211, 252, 0.5);
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
  background: rgba(59, 130, 246, 0.2);
  color: #bfdbfe;
}

.role-badge.user {
  background: rgba(16, 185, 129, 0.2);
  color: #bbf7d0;
}

.page-error {
  color: #fca5a5;
}

.page-success {
  color: #86efac;
}

@media (max-width: 640px) {
  .admin-dashboard__header {
    flex-direction: column;
  }

  .pending-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
