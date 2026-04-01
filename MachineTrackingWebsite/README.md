# Machine Usage Tracking

A full-stack web application that monitors, logs, and visualizes the operational uptime of physical machines in a lab or workshop. Physical microcontrollers (e.g. ESP32) attached to machines report their ON/OFF states via HTTP APIs. The web dashboard aggregates this telemetry data into a clean monthly calendar view showing proportional daily usage per machine.

**Target users:** lab managers and shop administrators who need an overview of equipment utilization.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 (Vue 3 frontend + Nitro server API) |
| Language | TypeScript (end-to-end) |
| Database | SQLite |
| ORM | Prisma |
| Styling | Vanilla CSS (scoped SFCs, CSS variables, dark-glass aesthetic) |
| Auth | Session-based (web dashboard) + API key header (`x-api-key`) for IoT devices |

---

## Core Features

1. **Event Ingestion** — Microcontrollers POST signals when a machine turns ON or OFF.
2. **Session Modeling** — Active usage is grouped into `MachineUsageSession` records (`started_at`, `ended_at`) rather than storing raw timestamps.
3. **Dynamic Aggregation** — The calendar endpoint queries sessions for the requested month, clips sessions that span across midnight to ensure accurate per-day attribution, and sums total active seconds per day.
4. **Monthly Calendar View** — A 7-column calendar renders proportional CSS bars per machine per day. The tallest bar is the maximum usage day, and all others scale relative to it.
5. **Daily Timeline View** — Clicking any calendar day navigates to a Gantt-style timeline page showing exact session blocks for each machine across a 24-hour axis.
6. **Live Session Timers** — The dashboard shows currently active machines with a live elapsed-time counter updated every second.
7. **Admin Panel** — Admins can register machines, manage users (approve/deny pending registrations, delete accounts), and reset passwords.
8. **Stale Session Cleanup** — A scheduled Nitro task runs every hour to close sessions that have been open for more than 24 hours (e.g. device lost network before sending the end signal).

---

## Project Structure

```
├── app/
│   ├── components/          # Shared Vue components (Card, Nav, AppHeader, AddMachineModal…)
│   ├── middleware/          # Route middleware (admin auth guard, admin-login redirect)
│   ├── pages/
│   │   ├── dashboard.vue    # Monthly calendar with machine filter and live timers
│   │   ├── timeline/
│   │   │   └── [date].vue   # Gantt timeline for a specific day
│   │   ├── admin/           # Admin login, dashboard, change-password, reset-password
│   │   ├── login.vue
│   │   ├── register.vue
│   │   └── reset-password.vue
│   └── style/main.css
├── prisma/
│   └── schema.prisma        # Source of truth: Microcontroller, SensorData, MachineUsageSession, User, Session
├── server/
│   ├── api/
│   │   ├── admin/           # Admin CRUD: users, microcontrollers, approve/deny/delete, password
│   │   ├── auth/            # User register, login, logout, password reset
│   │   └── microcontroller/ # IoT ingestion (sensor, session/start, session/end) + dashboard reads (calendar, timeline, active, usage)
│   ├── middleware/
│   │   └── microcontroller-auth.ts  # Validates x-api-key for IoT write endpoints; exempts dashboard read endpoints
│   ├── tasks/
│   │   └── sessions/cleanup.ts      # Hourly cron: closes sessions open > 24 hours
│   └── utils/
│       ├── admin-auth.ts
│       ├── admin-password-mail.ts / reset.ts
│       ├── user-password-mail.ts / reset.ts
│       ├── login-rate-limit.ts      # In-memory rate limiter for login endpoints
│       └── session-seconds.ts       # Shared utility: clips a session to a time window and returns active seconds
```

---

## Data Flow

### IoT Device → Database
```
Device  →  POST /api/microcontroller/session/start  →  microcontroller-auth middleware
        →  Prisma  →  MachineUsageSession (started_at)
...
Device  →  POST /api/microcontroller/session/end    →  caps open session with ended_at
Device  →  POST /api/microcontroller/sensor         →  SensorData (machine_state, timestamp)
```

### Dashboard → UI
```
User navigates  →  Vue watch triggers useFetch  →  GET /api/microcontroller/calendar
               →  Prisma fetches sessions for month  →  calculateSessionSeconds() clips to day boundaries
               →  JSON response  →  Vue reactivity updates calendar grid
```

---

## API Reference

### Dashboard (user session required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/microcontroller/calendar?year=&month=` | Monthly usage totals per machine per day |
| GET | `/api/microcontroller/timeline?date=YYYY-MM-DD` | Session blocks for a single day (Gantt data) |
| GET | `/api/microcontroller/active` | Currently open sessions with `started_at` for live timers |
| GET | `/api/microcontroller/usage` | Today's usage summary + current ON/OFF state per machine |

### IoT Device (x-api-key header required)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/microcontroller/session/start` | Opens a new usage session (closes any dangling open session first) |
| POST | `/api/microcontroller/session/end` | Closes the current open session with `ended_at = now` |
| POST | `/api/microcontroller/sensor` | Logs a raw ON/OFF signal to `SensorData` |

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Submit registration (creates a `PendingUser`) |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/logout` | Clear session cookie |
| POST | `/api/auth/password/forgot` | Send password reset email |
| POST | `/api/auth/password/reset` | Apply new password from reset token |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/pending` | List pending registrations |
| POST | `/api/admin/approve` | Approve a pending user → creates `User` |
| POST | `/api/admin/deny` | Deny and delete a pending registration |
| GET | `/api/admin/users` | List all users |
| DELETE | `/api/admin/user` | Delete a user |
| GET | `/api/admin/microcontrollers` | List all machines |
| POST | `/api/admin/microcontroller` | Create a new machine (auto-generates API key if not provided) |
| DELETE | `/api/admin/microcontroller` | Delete a machine |

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm

### Setup

```bash
pnpm install
```

Create a `.env` file (see `.env.example`):

```env
DATABASE_URL="file:./prisma/dev.db"
NUXT_SESSION_PASSWORD="replace-with-32-plus-char-secret"

# Optional — SMTP for password reset emails (falls back to console.log in dev)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
```

Run database migrations:

```bash
pnpm dlx prisma migrate dev
```

Start the development server:

```bash
pnpm dev
```

---

## Security Notes

- IoT API keys are stored in **plain text** in the database. If the database is compromised all device keys are exposed. Hashing with bcrypt is recommended.
- Login endpoints are rate-limited in-memory. There is no rate limiting on the microcontroller ingestion endpoints — a malfunctioning device could flood `SensorData`.
- Password reset tokens are HMAC-signed JWTs with a 15-minute TTL.
