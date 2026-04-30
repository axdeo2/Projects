# AutoHorario — Medication Schedule App
**Date:** 2026-04-29  
**Domain:** autohorario.axelvd.dev  
**Status:** Approved

---

## 1. Overview

A simple web app that helps up to 3 pre-configured users create and manage medication schedules based on their medical prescriptions. The app auto-suggests optimal daily schedules, tracks remaining pills and end dates, and exports a weekly schedule as a downloadable PNG image.

---

## 2. Architecture

**Pattern:** Single-container monolith (React SPA + Express API)

```
Docker Container
├── Express (Node.js)
│   ├── Serves React static files (all non-API routes)
│   ├── POST   /api/login
│   ├── GET    /api/medications
│   ├── POST   /api/medications
│   ├── PUT    /api/medications/:id
│   ├── DELETE /api/medications/:id
│   ├── POST   /api/medications/:id/take   (deduct one dose)
│   └── GET    /api/schedule/suggest
└── React (Vite, compiled to /dist)
```

**Data persistence:** Two JSON files mounted as a Docker volume at `/app/data/`:
- `users.json` — pre-configured users with bcrypt-hashed passwords
- `data.json` — medications keyed by user ID

**Auth:** JWT tokens signed with `JWT_SECRET` env var, stored in `localStorage`, sent as `Authorization: Bearer <token>` header.

**Deployment:** Dokploy on Oracle server. Multi-stage Dockerfile. Domain configured with HTTPS via Traefik (built into Dokploy). Volume mount for `/app/data/` to persist JSON between redeploys.

---

## 3. Data Model

### User (in users.json)
```json
{
  "id": "user1",
  "username": "axel",
  "passwordHash": "<bcrypt hash>"
}
```
Three users max, pre-configured via environment variable `USERS_JSON` at deploy time.

### Medication (in data.json, keyed by userId)
```json
{
  "id": "uuid-v4",
  "name": "Amoxicilina",
  "dose": "500mg",
  "frequencyHours": 8,
  "condition": "after_meal",
  "totalPills": 21,
  "pillsRemaining": 21,
  "startDate": "2026-04-29",
  "suggestedStartHour": 8,
  "active": true
}
```

**condition values:**
- `fasting` — must be taken on empty stomach
- `before_meal` — 30 min before a meal
- `after_meal` — 30 min after a meal
- `any` — no food restriction

---

## 4. Auto-Schedule Logic

Meal anchors (fixed, not configurable):
- Breakfast: 08:00
- Lunch: 13:30
- Dinner: 20:30

Suggested start hour per condition:
| Condition    | First dose suggestion |
|-------------|----------------------|
| `fasting`   | 07:00                |
| `before_meal` | 07:30 (30 min before breakfast) |
| `after_meal`  | 08:30 (30 min after breakfast) |
| `any`       | Distributed evenly across waking hours (07:00–22:00), avoiding slots already taken by other medications |

Subsequent doses = `suggestedStartHour + N * frequencyHours`, wrapped to 24h.

The `/api/schedule/suggest` endpoint receives the list of active medications for a user and returns a `suggestedStartHour` for each, computed using the rules above to avoid time conflicts between medications.

---

## 5. Calculated Fields (derived, not stored)

- **End date:** `startDate + ceil(pillsRemaining / dosesPerDay)` days, where `dosesPerDay = 24 / frequencyHours`
- **Days remaining:** `endDate - today`
- **Today's schedule:** List of `{ time, medicationName, dose, condition }` sorted by time

---

## 6. UI — Four Screens

### 6.1 Login
- Username + password fields, submit button
- On success: JWT stored in localStorage, redirect to Dashboard
- No registration UI (users are pre-configured)

### 6.2 Dashboard (Today's Schedule)
- Header: today's date
- Timeline list of medications to take today, sorted by time
- Each item shows: time, medication name, dose, condition badge (fasting/before meal/after meal)
- "Tomé esta dosis" button per item → calls `POST /api/medications/:id/take` → decrements `pillsRemaining` by 1. Button is disabled and grayed out when `pillsRemaining === 0`. API returns 400 if called with 0 pills remaining.
- Pill counter badge per medication: "X pastillas restantes, hasta DD/MM/YYYY"
- Alert banner when any medication has ≤ 3 days of pills remaining

### 6.3 My Medications
- Card list of all active medications
- Each card: name, dose, frequency, condition, pills remaining, estimated end date
- "Agregar medicamento" button → opens modal form with fields:
  - Nombre (text)
  - Dosis (text, e.g. "500mg")
  - Cada cuántas horas (number: 4, 6, 8, 12, 24)
  - Condición (select: en ayunas, antes de comer, después de comer, sin restricción)
  - Total de pastillas/dosis (number)
  - Fecha de inicio (date, default today)
- "Sugerir horario" button per card → shows the auto-suggested start time
- Edit and Delete buttons per card

### 6.4 Weekly Schedule
- 7-column table (Mon–Sun) × time rows (07:00–22:00, hourly)
- Medication names displayed in their corresponding time cell, color-coded per medication
- "Descargar horario" button → uses `html2canvas` to capture the table as PNG and trigger browser download
- Only shows current week (Mon–Sun)

---

## 7. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React 18 + Vite | Fast dev, small bundle, broad ecosystem |
| UI Library | Tailwind CSS | Utility-first, no design system overhead |
| State | React Context + useReducer | No Redux needed for this scope |
| HTTP client | fetch (native) | No extra deps needed |
| Image export | html2canvas | Simple DOM-to-PNG, well supported |
| Backend | Node.js 20 + Express 4 | Same language as frontend, minimal setup |
| Auth | jsonwebtoken + bcryptjs | Standard, lightweight |
| Data | JSON files | Zero infrastructure for 3 users |
| Container | Docker (multi-stage) | Required for Dokploy |
| Deployment | Dokploy on Oracle VPS | Already available |
| HTTPS | Traefik via Dokploy | Automatic Let's Encrypt |

---

## 8. Project Structure

```
autohorario/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Medications.jsx
│   │   │   └── WeeklySchedule.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx        (nav sidebar)
│   │   │   ├── MedCard.jsx
│   │   │   ├── MedForm.jsx       (modal)
│   │   │   ├── DoseItem.jsx
│   │   │   └── ScheduleTable.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── api.js                (fetch wrappers)
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── medications.js
│   │   ├── middleware/
│   │   │   └── auth.js           (JWT verify)
│   │   ├── services/
│   │   │   ├── dataStore.js      (JSON read/write)
│   │   │   └── scheduler.js      (suggest logic)
│   │   └── index.js
│   └── data/                     (Docker volume mount)
│       ├── users.json
│       └── data.json
├── Dockerfile
└── docker-compose.yml
```

---

## 9. Dockerfile

Multi-stage build:
1. **Stage 1 (build):** Node 20 Alpine, install frontend deps, run `vite build`
2. **Stage 2 (runtime):** Node 20 Alpine, install backend deps only, copy compiled frontend from Stage 1, expose port 3000

---

## 10. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Random secret for signing tokens | `openssl rand -hex 32` |
| `USERS_JSON` | JSON array of 3 users with bcrypt hashes | `[{"id":"1","username":"axel","passwordHash":"$2b$..."}]` |
| `PORT` | Server port (default 3000) | `3000` |

---

## 11. Navigation

Bottom navigation bar on mobile, left sidebar on desktop. Four tabs:
- Hoy (Dashboard)
- Medicamentos
- Horario Semanal
- Salir (logout)

---

## 12. Out of Scope

- User registration or password reset
- Notifications / push alerts
- Multiple schedules per medication
- PDF export
- Offline PWA
- Medication database / autocomplete by drug name
