# AutoHorario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a medication schedule web app with login, CRUD for medications, auto-schedule suggestions, pill tracking, and weekly schedule PNG export — deployed via Docker on Dokploy at autohorario.axelvd.dev.

**Architecture:** Single Docker container running Express (Node 20) that serves a compiled React (Vite) SPA on all non-API routes, with medication data persisted in a JSON file mounted as a Docker volume. Three users are pre-configured via environment variable.

**Tech Stack:** React 18 + Vite + Tailwind CSS, React Router v6, html2canvas — Node.js 20 + Express 4, jsonwebtoken, bcryptjs — Jest (backend tests) — Docker multi-stage build, Dokploy.

---

## File Map

```
autohorario/
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── context/AuthContext.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Medications.jsx
│       │   └── WeeklySchedule.jsx
│       └── components/
│           ├── Layout.jsx
│           ├── MedCard.jsx
│           ├── MedForm.jsx
│           ├── DoseItem.jsx
│           └── ScheduleTable.jsx
├── backend/
│   ├── package.json
│   ├── jest.config.js
│   ├── data/
│   │   └── data.json          (Docker volume mount)
│   └── src/
│       ├── index.js
│       ├── middleware/auth.js
│       ├── routes/
│       │   ├── auth.js
│       │   └── medications.js
│       └── services/
│           ├── dataStore.js
│           ├── scheduler.js
│           └── __tests__/
│               ├── dataStore.test.js
│               ├── scheduler.test.js
│               └── routes.test.js
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `autohorario/backend/package.json`
- Create: `autohorario/frontend/package.json`
- Create: `autohorario/frontend/vite.config.js`
- Create: `autohorario/frontend/tailwind.config.js`
- Create: `autohorario/frontend/postcss.config.js`
- Create: `autohorario/frontend/index.html`
- Create: `autohorario/frontend/src/main.jsx`
- Create: `autohorario/backend/jest.config.js`
- Create: `autohorario/backend/data/data.json`

- [ ] **Step 1: Create project root and backend**

```bash
mkdir -p autohorario/backend/src/routes autohorario/backend/src/services/\_\_tests\_\_ autohorario/backend/src/middleware autohorario/backend/data
cd autohorario/backend
npm init -y
npm install express jsonwebtoken bcryptjs uuid
npm install --save-dev jest supertest
```

- [ ] **Step 2: Create `autohorario/backend/package.json` scripts and jest config**

Edit `autohorario/backend/package.json` to add:
```json
{
  "name": "autohorario-backend",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

- [ ] **Step 3: Create `autohorario/backend/jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
};
```

- [ ] **Step 4: Initialize empty data file**

Create `autohorario/backend/data/data.json`:
```json
{}
```

- [ ] **Step 5: Create frontend scaffold**

```bash
cd autohorario/frontend
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom html2canvas
```

- [ ] **Step 6: Configure `autohorario/frontend/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 7: Add Tailwind directives to CSS**

Replace the content of `autohorario/frontend/src/index.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Configure `autohorario/frontend/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

- [ ] **Step 9: Commit scaffold**

```bash
cd autohorario
git add .
git commit -m "feat: scaffold frontend and backend projects"
```

---

## Task 2: Backend — Data Store Service

**Files:**
- Create: `autohorario/backend/src/services/dataStore.js`
- Create: `autohorario/backend/src/services/__tests__/dataStore.test.js`

The store reads/writes `data.json` (medications by userId). Users come exclusively from the `USERS_JSON` environment variable — never stored in a file.

- [ ] **Step 1: Write failing tests for dataStore**

Create `autohorario/backend/src/services/__tests__/dataStore.test.js`:

```js
const path = require('path');
const fs = require('fs');
const os = require('os');

// Point dataStore at a temp dir for tests
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autohorario-test-'));
process.env.DATA_DIR = tmpDir;

const { getUsers, getMedications, addMedication, updateMedication, deleteMedication, takeDose } = require('../dataStore');

beforeEach(() => {
  const dataFile = path.join(tmpDir, 'data.json');
  fs.writeFileSync(dataFile, JSON.stringify({}));
  process.env.USERS_JSON = JSON.stringify([
    { id: 'u1', username: 'axel', passwordHash: '$2b$10$fakehashfortest123456789012345678' },
  ]);
});

describe('getUsers', () => {
  test('returns users parsed from USERS_JSON env var', () => {
    const users = getUsers();
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe('axel');
  });
});

describe('getMedications', () => {
  test('returns empty array for user with no medications', () => {
    const meds = getMedications('u1');
    expect(meds).toEqual([]);
  });
});

describe('addMedication', () => {
  test('adds medication and returns it with generated id', () => {
    const med = addMedication('u1', {
      name: 'Amoxicilina',
      dose: '500mg',
      frequencyHours: 8,
      condition: 'after_meal',
      totalPills: 21,
      pillsRemaining: 21,
      startDate: '2026-04-29',
      suggestedStartHour: 8,
      active: true,
    });
    expect(med.id).toBeDefined();
    expect(getMedications('u1')).toHaveLength(1);
  });
});

describe('updateMedication', () => {
  test('updates fields of an existing medication', () => {
    const med = addMedication('u1', { name: 'Ibuprofeno', dose: '400mg', frequencyHours: 8, condition: 'after_meal', totalPills: 10, pillsRemaining: 10, startDate: '2026-04-29', suggestedStartHour: 9, active: true });
    const updated = updateMedication('u1', med.id, { name: 'Ibuprofeno 600mg' });
    expect(updated.name).toBe('Ibuprofeno 600mg');
    expect(updated.dose).toBe('400mg');
  });

  test('throws if medication not found', () => {
    expect(() => updateMedication('u1', 'nonexistent', { name: 'X' })).toThrow('not found');
  });
});

describe('deleteMedication', () => {
  test('removes medication from list', () => {
    const med = addMedication('u1', { name: 'X', dose: '10mg', frequencyHours: 24, condition: 'any', totalPills: 5, pillsRemaining: 5, startDate: '2026-04-29', suggestedStartHour: 10, active: true });
    deleteMedication('u1', med.id);
    expect(getMedications('u1')).toHaveLength(0);
  });

  test('throws if medication not found', () => {
    expect(() => deleteMedication('u1', 'nonexistent')).toThrow('not found');
  });
});

describe('takeDose', () => {
  test('decrements pillsRemaining by 1', () => {
    const med = addMedication('u1', { name: 'X', dose: '10mg', frequencyHours: 8, condition: 'any', totalPills: 5, pillsRemaining: 5, startDate: '2026-04-29', suggestedStartHour: 10, active: true });
    const updated = takeDose('u1', med.id);
    expect(updated.pillsRemaining).toBe(4);
  });

  test('throws if pillsRemaining is already 0', () => {
    const med = addMedication('u1', { name: 'X', dose: '10mg', frequencyHours: 8, condition: 'any', totalPills: 5, pillsRemaining: 0, startDate: '2026-04-29', suggestedStartHour: 10, active: true });
    expect(() => takeDose('u1', med.id)).toThrow('No pills remaining');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd autohorario/backend
npm test -- --testPathPattern=dataStore
```

Expected: FAIL — "Cannot find module '../dataStore'"

- [ ] **Step 3: Implement `autohorario/backend/src/services/dataStore.js`**

```js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

function readData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getUsers() {
  return JSON.parse(process.env.USERS_JSON || '[]');
}

function getMedications(userId) {
  const data = readData();
  return data[userId] || [];
}

function saveMedications(userId, meds) {
  const data = readData();
  data[userId] = meds;
  writeData(data);
}

function addMedication(userId, med) {
  const meds = getMedications(userId);
  const newMed = { ...med, id: uuidv4() };
  meds.push(newMed);
  saveMedications(userId, meds);
  return newMed;
}

function updateMedication(userId, id, updates) {
  const meds = getMedications(userId);
  const idx = meds.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error(`Medication ${id} not found`);
  meds[idx] = { ...meds[idx], ...updates };
  saveMedications(userId, meds);
  return meds[idx];
}

function deleteMedication(userId, id) {
  const meds = getMedications(userId);
  const idx = meds.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error(`Medication ${id} not found`);
  meds.splice(idx, 1);
  saveMedications(userId, meds);
}

function takeDose(userId, id) {
  const meds = getMedications(userId);
  const med = meds.find((m) => m.id === id);
  if (!med) throw new Error(`Medication ${id} not found`);
  if (med.pillsRemaining <= 0) throw new Error('No pills remaining');
  return updateMedication(userId, id, { pillsRemaining: med.pillsRemaining - 1 });
}

module.exports = { getUsers, getMedications, addMedication, updateMedication, deleteMedication, takeDose };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd autohorario/backend
npm test -- --testPathPattern=dataStore
```

Expected: PASS — 8 tests

- [ ] **Step 5: Commit**

```bash
git add autohorario/backend/src/services/dataStore.js autohorario/backend/src/services/__tests__/dataStore.test.js
git commit -m "feat: add dataStore service with tests"
```

---

## Task 3: Backend — Scheduler Service

**Files:**
- Create: `autohorario/backend/src/services/scheduler.js`
- Create: `autohorario/backend/src/services/__tests__/scheduler.test.js`

The scheduler takes a list of active medications and returns a suggested `startHour` (integer 0–23) for each, based on condition and avoiding conflicts.

Rules:
- `fasting` → 7
- `before_meal` → 7 (30 min before breakfast at 8)
- `after_meal` → 9 (30 min after breakfast at 8)
- `any` → tries slots [10, 8, 11, 12, 14, 16, 18, 20] in order, picks first slot with no existing dose within ±1 hour

Conflict check: a slot `h` conflicts with an existing medication if any of its doses `(startHour + N * frequencyHours) % 24` falls within 1 hour of `h`.

- [ ] **Step 1: Write failing tests**

Create `autohorario/backend/src/services/__tests__/scheduler.test.js`:

```js
const { suggestSchedule } = require('../scheduler');

describe('suggestSchedule', () => {
  test('assigns fasting medication to hour 7', () => {
    const meds = [{ id: '1', condition: 'fasting', frequencyHours: 24, active: true }];
    const result = suggestSchedule(meds);
    expect(result.find((r) => r.id === '1').suggestedStartHour).toBe(7);
  });

  test('assigns before_meal medication to hour 7', () => {
    const meds = [{ id: '1', condition: 'before_meal', frequencyHours: 8, active: true }];
    const result = suggestSchedule(meds);
    expect(result.find((r) => r.id === '1').suggestedStartHour).toBe(7);
  });

  test('assigns after_meal medication to hour 9', () => {
    const meds = [{ id: '1', condition: 'after_meal', frequencyHours: 8, active: true }];
    const result = suggestSchedule(meds);
    expect(result.find((r) => r.id === '1').suggestedStartHour).toBe(9);
  });

  test('assigns any medication to hour 10 when no conflicts', () => {
    const meds = [{ id: '1', condition: 'any', frequencyHours: 24, active: true }];
    const result = suggestSchedule(meds);
    expect(result.find((r) => r.id === '1').suggestedStartHour).toBe(10);
  });

  test('avoids conflict for any medication when hour 10 is taken', () => {
    const meds = [
      { id: '1', condition: 'any', frequencyHours: 24, suggestedStartHour: 10, active: true },
      { id: '2', condition: 'any', frequencyHours: 24, active: true },
    ];
    const result = suggestSchedule(meds);
    const h1 = result.find((r) => r.id === '1').suggestedStartHour;
    const h2 = result.find((r) => r.id === '2').suggestedStartHour;
    expect(Math.abs(h1 - h2)).toBeGreaterThan(1);
  });

  test('skips inactive medications', () => {
    const meds = [{ id: '1', condition: 'fasting', frequencyHours: 24, active: false }];
    const result = suggestSchedule(meds);
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd autohorario/backend
npm test -- --testPathPattern=scheduler
```

Expected: FAIL — "Cannot find module '../scheduler'"

- [ ] **Step 3: Implement `autohorario/backend/src/services/scheduler.js`**

```js
const CONDITION_HOURS = {
  fasting: 7,
  before_meal: 7,
  after_meal: 9,
};

const ANY_PREFERENCE = [10, 8, 11, 12, 14, 16, 18, 20];

function getDoseHours(startHour, frequencyHours) {
  const hours = [];
  for (let h = startHour; h < 24; h += frequencyHours) {
    hours.push(h % 24);
  }
  return hours;
}

function hasConflict(candidateHour, assignedMeds) {
  for (const med of assignedMeds) {
    const doses = getDoseHours(med.suggestedStartHour, med.frequencyHours);
    for (const dose of doses) {
      if (Math.abs(candidateHour - dose) <= 1) return true;
    }
  }
  return false;
}

function suggestSchedule(medications) {
  const active = medications.filter((m) => m.active);
  const assigned = [];
  const result = [];

  for (const med of active) {
    if (med.condition !== 'any') {
      const hour = CONDITION_HOURS[med.condition] ?? 9;
      assigned.push({ ...med, suggestedStartHour: hour });
      result.push({ id: med.id, suggestedStartHour: hour });
    }
  }

  for (const med of active) {
    if (med.condition === 'any') {
      const slot = ANY_PREFERENCE.find((h) => !hasConflict(h, assigned)) ?? 10;
      assigned.push({ ...med, suggestedStartHour: slot });
      result.push({ id: med.id, suggestedStartHour: slot });
    }
  }

  return result;
}

module.exports = { suggestSchedule };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd autohorario/backend
npm test -- --testPathPattern=scheduler
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add autohorario/backend/src/services/scheduler.js autohorario/backend/src/services/__tests__/scheduler.test.js
git commit -m "feat: add scheduler service with tests"
```

---

## Task 4: Backend — Express Server + JWT Middleware + Auth Route

**Files:**
- Create: `autohorario/backend/src/index.js`
- Create: `autohorario/backend/src/middleware/auth.js`
- Create: `autohorario/backend/src/routes/auth.js`
- Create: `autohorario/backend/src/services/__tests__/routes.test.js`

- [ ] **Step 1: Write failing tests for auth route**

Create `autohorario/backend/src/services/__tests__/routes.test.js`:

```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const os = require('os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autohorario-routes-'));
process.env.DATA_DIR = tmpDir;
process.env.JWT_SECRET = 'test-secret-32chars-padding-here';

const hash = bcrypt.hashSync('password123', 10);
process.env.USERS_JSON = JSON.stringify([
  { id: 'u1', username: 'axel', passwordHash: hash },
]);

const app = require('../index');

beforeEach(() => {
  fs.writeFileSync(path.join(tmpDir, 'data.json'), JSON.stringify({}));
});

describe('POST /api/login', () => {
  test('returns token on valid credentials', async () => {
    const res = await request(app).post('/api/login').send({ username: 'axel', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/login').send({ username: 'axel', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('returns 401 on unknown user', async () => {
    const res = await request(app).post('/api/login').send({ username: 'nobody', password: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('Medications API (authenticated)', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/login').send({ username: 'axel', password: 'password123' });
    token = res.body.token;
  });

  test('GET /api/medications returns empty array initially', async () => {
    const res = await request(app).get('/api/medications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/medications creates a medication', async () => {
    const res = await request(app)
      .post('/api/medications')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Amoxicilina', dose: '500mg', frequencyHours: 8, condition: 'after_meal', totalPills: 21, startDate: '2026-04-29' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.pillsRemaining).toBe(21);
  });

  test('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/medications');
    expect(res.status).toBe(401);
  });

  test('POST /api/medications/:id/take decrements pillsRemaining', async () => {
    const create = await request(app)
      .post('/api/medications')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', dose: '10mg', frequencyHours: 8, condition: 'any', totalPills: 5, startDate: '2026-04-29' });
    const id = create.body.id;
    const res = await request(app).post(`/api/medications/${id}/take`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pillsRemaining).toBe(4);
  });

  test('DELETE /api/medications/:id removes medication', async () => {
    const create = await request(app)
      .post('/api/medications')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', dose: '10mg', frequencyHours: 8, condition: 'any', totalPills: 5, startDate: '2026-04-29' });
    const id = create.body.id;
    await request(app).delete(`/api/medications/${id}`).set('Authorization', `Bearer ${token}`);
    const list = await request(app).get('/api/medications').set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd autohorario/backend
npm test -- --testPathPattern=routes
```

Expected: FAIL — "Cannot find module '../index'"

- [ ] **Step 3: Create `autohorario/backend/src/middleware/auth.js`**

```js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
```

- [ ] **Step 4: Create `autohorario/backend/src/routes/auth.js`**

```js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUsers } = require('../services/dataStore');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

module.exports = router;
```

- [ ] **Step 5: Create `autohorario/backend/src/routes/medications.js`**

```js
const router = require('express').Router();
const auth = require('../middleware/auth');
const { getMedications, addMedication, updateMedication, deleteMedication, takeDose } = require('../services/dataStore');
const { suggestSchedule } = require('../services/scheduler');

router.use(auth);

router.get('/', (req, res) => {
  res.json(getMedications(req.user.userId));
});

router.post('/', (req, res) => {
  const { name, dose, frequencyHours, condition, totalPills, startDate } = req.body;
  const meds = getMedications(req.user.userId);
  const suggested = suggestSchedule([...meds, { condition, frequencyHours, active: true }]);
  const suggestedStartHour = suggested.at(-1)?.suggestedStartHour ?? 9;
  const med = addMedication(req.user.userId, {
    name, dose, frequencyHours, condition,
    totalPills, pillsRemaining: totalPills,
    startDate, suggestedStartHour, active: true,
  });
  res.status(201).json(med);
});

router.put('/:id', (req, res) => {
  try {
    const updated = updateMedication(req.user.userId, req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    deleteMedication(req.user.userId, req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.post('/:id/take', (req, res) => {
  try {
    const updated = takeDose(req.user.userId, req.params.id);
    res.json(updated);
  } catch (e) {
    const status = e.message === 'No pills remaining' ? 400 : 404;
    res.status(status).json({ error: e.message });
  }
});

router.get('/suggest', (req, res) => {
  const meds = getMedications(req.user.userId).filter((m) => m.active);
  res.json(suggestSchedule(meds));
});

module.exports = router;
```

- [ ] **Step 6: Create `autohorario/backend/src/index.js`**

```js
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

app.use('/api/login', require('./routes/auth'));
app.use('/api/medications', require('./routes/medications'));

// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd autohorario/backend
npm test
```

Expected: PASS — all tests across dataStore, scheduler, routes

- [ ] **Step 8: Commit**

```bash
git add autohorario/backend/src/
git commit -m "feat: add Express server, auth route, JWT middleware, medications routes"
```

---

## Task 5: Frontend — App Shell (AuthContext + Router + Layout)

**Files:**
- Create: `autohorario/frontend/src/api.js`
- Create: `autohorario/frontend/src/context/AuthContext.jsx`
- Create: `autohorario/frontend/src/App.jsx`
- Create: `autohorario/frontend/src/components/Layout.jsx`
- Modify: `autohorario/frontend/src/main.jsx`

- [ ] **Step 1: Create `autohorario/frontend/src/api.js`**

```js
const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

export async function getMedications() {
  const res = await fetch(`${BASE}/medications`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch medications');
  return res.json();
}

export async function addMedication(data) {
  const res = await fetch(`${BASE}/medications`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to add medication');
  return res.json();
}

export async function updateMedication(id, data) {
  const res = await fetch(`${BASE}/medications/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update medication');
  return res.json();
}

export async function deleteMedication(id) {
  const res = await fetch(`${BASE}/medications/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to delete medication');
}

export async function takeDose(id) {
  const res = await fetch(`${BASE}/medications/${id}/take`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Failed to take dose');
  }
  return res.json();
}

export async function getSuggestedSchedule() {
  const res = await fetch(`${BASE}/medications/suggest`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get suggestions');
  return res.json();
}
```

- [ ] **Step 2: Create `autohorario/frontend/src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState } from 'react';
import { login as apiLogin } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return token ? { token, username } : null;
  });

  async function login(username, password) {
    const data = await apiLogin(username, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    setUser({ token: data.token, username: data.username });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 3: Create `autohorario/frontend/src/components/Layout.jsx`**

```jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Hoy', icon: '📅' },
  { to: '/medicamentos', label: 'Medicamentos', icon: '💊' },
  { to: '/horario', label: 'Horario', icon: '📋' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <nav className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 p-4 gap-2">
        <p className="text-sm text-gray-500 mb-4">Hola, <strong>{user?.username}</strong></p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <button onClick={handleLogout} className="mt-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50">
          🚪 Salir
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 pb-20 md:pb-4">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs gap-0.5 px-3 py-1 rounded-lg ${isActive ? 'text-blue-600' : 'text-gray-500'}`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <button onClick={handleLogout} className="flex flex-col items-center text-xs gap-0.5 px-3 py-1 text-red-400">
          <span className="text-xl">🚪</span>Salir
        </button>
      </nav>
    </div>
  );
}
```

- [ ] **Step 4: Create `autohorario/frontend/src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Medications from './pages/Medications';
import WeeklySchedule from './pages/WeeklySchedule';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="medicamentos" element={<Medications />} />
            <Route path="horario" element={<WeeklySchedule />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 5: Update `autohorario/frontend/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Verify the dev server starts**

```bash
cd autohorario/backend && node src/index.js &
cd autohorario/frontend && npm run dev
```

Open http://localhost:5173 — should redirect to /login (page will be blank since Login doesn't exist yet, but no errors in console).

- [ ] **Step 7: Commit**

```bash
git add autohorario/frontend/src/
git commit -m "feat: add React app shell with AuthContext, routing, and Layout"
```

---

## Task 6: Frontend — Login Page

**Files:**
- Create: `autohorario/frontend/src/pages/Login.jsx`

- [ ] **Step 1: Create `autohorario/frontend/src/pages/Login.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">💊</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">AutoHorario</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de medicamentos</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Start both servers and open http://localhost:5173/login. Try wrong credentials (should show error), then try correct credentials (should redirect to /). The dashboard will be blank — that's expected.

- [ ] **Step 3: Commit**

```bash
git add autohorario/frontend/src/pages/Login.jsx
git commit -m "feat: add Login page"
```

---

## Task 7: Frontend — Dashboard Page

**Files:**
- Create: `autohorario/frontend/src/pages/Dashboard.jsx`
- Create: `autohorario/frontend/src/components/DoseItem.jsx`

The dashboard shows today's dose schedule for all active medications. A dose appears at each `suggestedStartHour + N * frequencyHours` that falls between 00:00 and 23:59.

- [ ] **Step 1: Create `autohorario/frontend/src/components/DoseItem.jsx`**

```jsx
import { useState } from 'react';
import { takeDose } from '../api';

const CONDITION_LABELS = {
  fasting: { label: 'En ayunas', color: 'bg-yellow-100 text-yellow-800' },
  before_meal: { label: 'Antes de comer', color: 'bg-orange-100 text-orange-800' },
  after_meal: { label: 'Después de comer', color: 'bg-green-100 text-green-800' },
  any: { label: 'Sin restricción', color: 'bg-gray-100 text-gray-600' },
};

export default function DoseItem({ med, time, onTaken }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const condition = CONDITION_LABELS[med.condition] || CONDITION_LABELS.any;
  const canTake = med.pillsRemaining > 0;

  async function handleTake() {
    setError('');
    setLoading(true);
    try {
      await takeDose(med.id);
      onTaken();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl font-bold text-blue-600 w-16 shrink-0">{time}</span>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{med.name}</p>
          <p className="text-xs text-gray-500">{med.dose}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${condition.color}`}>{condition.label}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={handleTake}
          disabled={!canTake || loading}
          className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '...' : canTake ? 'Tomé esta dosis' : 'Sin pastillas'}
        </button>
        <p className="text-xs text-gray-400">{med.pillsRemaining} restantes</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `autohorario/frontend/src/pages/Dashboard.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { getMedications } from '../api';
import DoseItem from '../components/DoseItem';

function getTodayDoses(medications) {
  const today = new Date();
  const doses = [];
  for (const med of medications) {
    if (!med.active) continue;
    const start = new Date(med.startDate + 'T00:00:00');
    if (today < start) continue;
    for (let h = med.suggestedStartHour; h < 24; h += med.frequencyHours) {
      const hour = Math.floor(h) % 24;
      const time = `${String(hour).padStart(2, '0')}:00`;
      doses.push({ med, time, sortKey: hour });
    }
  }
  return doses.sort((a, b) => a.sortKey - b.sortKey);
}

function getEndDate(med) {
  if (med.pillsRemaining === 0) return null;
  const dosesPerDay = 24 / med.frequencyHours;
  const daysLeft = Math.ceil(med.pillsRemaining / dosesPerDay);
  const end = new Date(med.startDate + 'T00:00:00');
  end.setDate(end.getDate() + daysLeft);
  return end.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(med) {
  if (med.pillsRemaining === 0) return 0;
  return Math.ceil(med.pillsRemaining / (24 / med.frequencyHours));
}

export default function Dashboard() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getMedications();
      setMedications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doses = getTodayDoses(medications);
  const lowMeds = medications.filter((m) => m.active && daysLeft(m) <= 3 && m.pillsRemaining > 0);
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-1 capitalize">{today}</h1>
      <p className="text-sm text-gray-500 mb-4">Tu horario de medicamentos para hoy</p>

      {lowMeds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-sm font-medium text-amber-800">⚠️ Medicamentos por terminar:</p>
          {lowMeds.map((m) => (
            <p key={m.id} className="text-xs text-amber-700 mt-1">{m.name} — {daysLeft(m)} día(s) restantes ({m.pillsRemaining} pastillas)</p>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : doses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">💊</p>
          <p className="text-sm">No tienes medicamentos activos hoy.</p>
          <p className="text-xs mt-1">Ve a "Medicamentos" para agregar uno.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {doses.map(({ med, time }, i) => (
            <DoseItem key={`${med.id}-${time}-${i}`} med={med} time={time} onTaken={load} />
          ))}
        </div>
      )}

      {medications.filter((m) => m.active).map((m) => (
        <div key={m.id} className="mt-2 text-xs text-gray-400 flex justify-between">
          <span>{m.name}</span>
          <span>{m.pillsRemaining} pastillas · hasta {getEndDate(m) || 'agotado'}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Test in browser**

Log in, go to Dashboard. With no medications it should show empty state. Add one via the API or wait for Task 8 to add via UI.

- [ ] **Step 4: Commit**

```bash
git add autohorario/frontend/src/pages/Dashboard.jsx autohorario/frontend/src/components/DoseItem.jsx
git commit -m "feat: add Dashboard page with today's dose schedule"
```

---

## Task 8: Frontend — Medications Page

**Files:**
- Create: `autohorario/frontend/src/pages/Medications.jsx`
- Create: `autohorario/frontend/src/components/MedCard.jsx`
- Create: `autohorario/frontend/src/components/MedForm.jsx`

- [ ] **Step 1: Create `autohorario/frontend/src/components/MedForm.jsx`**

```jsx
import { useState } from 'react';

const CONDITIONS = [
  { value: 'fasting', label: 'En ayunas' },
  { value: 'before_meal', label: 'Antes de comer' },
  { value: 'after_meal', label: 'Después de comer' },
  { value: 'any', label: 'Sin restricción' },
];

const FREQUENCIES = [4, 6, 8, 12, 24];

export default function MedForm({ initial, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    name: initial?.name || '',
    dose: initial?.dose || '',
    frequencyHours: initial?.frequencyHours || 8,
    condition: initial?.condition || 'any',
    totalPills: initial?.totalPills || '',
    startDate: initial?.startDate || today,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave({ ...form, frequencyHours: Number(form.frequencyHours), totalPills: Number(form.totalPills) });
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">{initial ? 'Editar medicamento' : 'Agregar medicamento'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input required value={form.name} onChange={set('name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Amoxicilina" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dosis</label>
            <input required value={form.dose} onChange={set('dose')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: 500mg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cada cuántas horas</label>
            <select value={form.frequencyHours} onChange={set('frequencyHours')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {FREQUENCIES.map((f) => <option key={f} value={f}>Cada {f} horas</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Condición de toma</label>
            <select value={form.condition} onChange={set('condition')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total de pastillas/dosis</label>
            <input required type="number" min="1" value={form.totalPills} onChange={set('totalPills')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: 21" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de inicio</label>
            <input required type="date" value={form.startDate} onChange={set('startDate')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `autohorario/frontend/src/components/MedCard.jsx`**

```jsx
const CONDITION_LABELS = {
  fasting: 'En ayunas',
  before_meal: 'Antes de comer',
  after_meal: 'Después de comer',
  any: 'Sin restricción',
};

function getEndDate(med) {
  if (med.pillsRemaining === 0) return 'Agotado';
  const dosesPerDay = 24 / med.frequencyHours;
  const daysLeft = Math.ceil(med.pillsRemaining / dosesPerDay);
  const end = new Date(med.startDate + 'T00:00:00');
  end.setDate(end.getDate() + daysLeft);
  return end.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function MedCard({ med, onEdit, onDelete }) {
  const endDate = getEndDate(med);
  const isLow = med.pillsRemaining <= 3 * (24 / med.frequencyHours);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-800">{med.name}</h3>
          <p className="text-sm text-gray-500">{med.dose} · cada {med.frequencyHours}h</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(med)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Editar</button>
          <button onClick={() => onDelete(med.id)} className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Eliminar</button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="bg-gray-100 px-2 py-0.5 rounded-full">{CONDITION_LABELS[med.condition]}</span>
        <span>Hora sugerida: <strong>{String(med.suggestedStartHour).padStart(2, '0')}:00</strong></span>
      </div>
      <div className={`flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-100 ${isLow ? 'text-amber-600' : 'text-gray-500'}`}>
        <span>{isLow ? '⚠️' : '💊'} {med.pillsRemaining} pastillas restantes</span>
        <span>Hasta {endDate}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `autohorario/frontend/src/pages/Medications.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { getMedications, addMedication, updateMedication, deleteMedication } from '../api';
import MedCard from '../components/MedCard';
import MedForm from '../components/MedForm';

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getMedications();
      setMedications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(formData) {
    if (editing) {
      await updateMedication(editing.id, formData);
    } else {
      await addMedication(formData);
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este medicamento?')) return;
    await deleteMedication(id);
    load();
  }

  function handleEdit(med) {
    setEditing(med);
    setShowForm(true);
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mis medicamentos</h1>
          <p className="text-sm text-gray-500">{medications.filter((m) => m.active).length} activos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Agregar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : medications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">💊</p>
          <p className="text-sm">No tienes medicamentos registrados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {medications.map((med) => (
            <MedCard key={med.id} med={med} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <MedForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Test in browser**

Log in, go to Medicamentos. Add a medication via the form. Verify it appears in the list with the suggested hour. Return to Dashboard and verify the doses appear.

- [ ] **Step 5: Commit**

```bash
git add autohorario/frontend/src/pages/Medications.jsx autohorario/frontend/src/components/MedCard.jsx autohorario/frontend/src/components/MedForm.jsx
git commit -m "feat: add Medications page with add/edit/delete"
```

---

## Task 9: Frontend — Weekly Schedule Page

**Files:**
- Create: `autohorario/frontend/src/pages/WeeklySchedule.jsx`
- Create: `autohorario/frontend/src/components/ScheduleTable.jsx`

- [ ] **Step 1: Create `autohorario/frontend/src/components/ScheduleTable.jsx`**

```jsx
import { forwardRef } from 'react';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00
const COLORS = ['bg-blue-200 text-blue-900', 'bg-green-200 text-green-900', 'bg-purple-200 text-purple-900', 'bg-rose-200 text-rose-900', 'bg-amber-200 text-amber-900', 'bg-teal-200 text-teal-900'];

function getWeekDays() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon...
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((day === 0 ? 7 : day) - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function getMedDoses(med, date) {
  const start = new Date(med.startDate + 'T00:00:00');
  if (date < start) return [];
  const doses = [];
  for (let h = med.suggestedStartHour; h < 24; h += med.frequencyHours) {
    doses.push(Math.floor(h) % 24);
  }
  return doses;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const ScheduleTable = forwardRef(function ScheduleTable({ medications }, ref) {
  const weekDays = getWeekDays();
  const activeMeds = medications.filter((m) => m.active);

  return (
    <div ref={ref} className="bg-white rounded-xl border border-gray-200 overflow-auto">
      <table className="w-full text-xs border-collapse min-w-[500px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-2 py-1 text-left w-14 text-gray-500 font-medium">Hora</th>
            {weekDays.map((d, i) => (
              <th key={i} className="border border-gray-200 px-1 py-1 text-center font-medium text-gray-700">
                <div>{DAY_LABELS[i]}</div>
                <div className="text-gray-400 font-normal">{d.getDate()}/{d.getMonth() + 1}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-2 py-1 text-gray-400 font-mono">{String(hour).padStart(2, '0')}:00</td>
              {weekDays.map((date, di) => {
                const medsThisSlot = activeMeds.filter((m) => getMedDoses(m, date).includes(hour));
                return (
                  <td key={di} className="border border-gray-200 px-1 py-1 align-top h-8">
                    {medsThisSlot.map((m, mi) => (
                      <span key={m.id} className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium truncate max-w-full ${COLORS[mi % COLORS.length]}`}>
                        {m.name}
                      </span>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default ScheduleTable;
```

- [ ] **Step 2: Create `autohorario/frontend/src/pages/WeeklySchedule.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { getMedications } from '../api';
import ScheduleTable from '../components/ScheduleTable';

export default function WeeklySchedule() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const tableRef = useRef(null);

  useEffect(() => {
    getMedications().then(setMedications).finally(() => setLoading(false));
  }, []);

  async function handleDownload() {
    if (!tableRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `horario-semana-${new Date().toISOString().split('T')[0]}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Horario semanal</h1>
          <p className="text-sm text-gray-500">Semana actual</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || loading || medications.length === 0}
          className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {downloading ? 'Generando...' : '⬇ Descargar imagen'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : medications.filter((m) => m.active).length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">No tienes medicamentos activos para mostrar en el horario.</p>
        </div>
      ) : (
        <ScheduleTable ref={tableRef} medications={medications} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Test in browser**

Log in, add at least 2 medications with different frequencies, go to Horario Semanal. Verify the table shows medications in the correct time slots. Click "Descargar imagen" and verify the PNG downloads and looks correct.

- [ ] **Step 4: Commit**

```bash
git add autohorario/frontend/src/pages/WeeklySchedule.jsx autohorario/frontend/src/components/ScheduleTable.jsx
git commit -m "feat: add Weekly Schedule page with PNG export"
```

---

## Task 10: Docker + Deployment Setup

**Files:**
- Create: `autohorario/Dockerfile`
- Create: `autohorario/docker-compose.yml`
- Create: `autohorario/.env.example`

- [ ] **Step 1: Create `autohorario/Dockerfile`**

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src/ ./src/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "src/index.js"]
```

- [ ] **Step 2: Update `autohorario/backend/src/index.js` for production static path**

The current path for static files assumes `../../frontend/dist` relative to `src/index.js`. In the Docker image the structure is:
```
/app/
├── src/index.js
├── frontend/dist/
└── data/
```

Update the static path in `autohorario/backend/src/index.js`:

```js
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

app.use('/api/login', require('./routes/auth'));
app.use('/api/medications', require('./routes/medications'));

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
```

- [ ] **Step 3: Create `autohorario/docker-compose.yml`** (for local testing of the container)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - app-data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET}
      - USERS_JSON=${USERS_JSON}

volumes:
  app-data:
```

- [ ] **Step 4: Create `autohorario/.env.example`**

```
JWT_SECRET=replace-with-output-of-openssl-rand-hex-32
USERS_JSON=[{"id":"1","username":"axel","passwordHash":"$2b$10$..."},{"id":"2","username":"usuario2","passwordHash":"$2b$10$..."},{"id":"3","username":"usuario3","passwordHash":"$2b$10$..."}]
```

- [ ] **Step 5: Build and test the Docker image locally**

First, generate bcrypt hashes for your 3 users (run once):

```bash
cd autohorario/backend
node -e "const b=require('bcryptjs'); ['pass1','pass2','pass3'].forEach((p,i)=>console.log(i+1, b.hashSync(p,10)))"
```

Then build and run:

```bash
cd autohorario
docker build -t autohorario .
docker run --rm -p 3000:3000 \
  -e JWT_SECRET="test-secret-minimum-32-chars-long-ok" \
  -e USERS_JSON='[{"id":"1","username":"axel","passwordHash":"REPLACE_WITH_HASH"}]' \
  autohorario
```

Open http://localhost:3000 — full app should work: login, add medications, dashboard, weekly schedule, download PNG.

- [ ] **Step 6: Run backend tests one final time to confirm nothing broke**

```bash
cd autohorario/backend
npm test
```

Expected: PASS — all tests

- [ ] **Step 7: Commit**

```bash
cd autohorario
git add Dockerfile docker-compose.yml .env.example backend/src/index.js
git commit -m "feat: add Dockerfile and docker-compose for Dokploy deployment"
```

---

## Task 11: Dokploy Deployment

This task is done via the Dokploy UI — no code changes.

- [ ] **Step 1: Push to GitHub**

```bash
cd autohorario
git remote add origin https://github.com/axdeo2/autohorario.git  # or existing repo
git push -u origin main
```

- [ ] **Step 2: Generate production secrets**

Run locally:

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate bcrypt hashes for your 3 users (replace mypassword with real passwords)
cd autohorario/backend
node -e "const b=require('bcryptjs'); console.log(b.hashSync('mypassword', 10))"
```

Build the `USERS_JSON` value:
```json
[
  {"id":"1","username":"axel","passwordHash":"$2b$10$...hash1..."},
  {"id":"2","username":"user2","passwordHash":"$2b$10$...hash2..."},
  {"id":"3","username":"user3","passwordHash":"$2b$10$...hash3..."}
]
```

- [ ] **Step 3: Create app in Dokploy**

1. Log into Dokploy dashboard on the Oracle server
2. Create new Application → type: Docker Compose or Application (from Git)
3. Connect GitHub repo `axdeo2/autohorario`
4. Set build context to `autohorario/` (subdirectory), Dockerfile: `Dockerfile`
5. Set environment variables:
   - `JWT_SECRET` = value from Step 2
   - `USERS_JSON` = JSON from Step 2 (single line, no newlines)
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
6. Add volume: `/app/data` → persistent volume named `autohorario-data`
7. Set domain: `autohorario.axelvd.dev` with HTTPS enabled

- [ ] **Step 4: Deploy and verify**

1. Click Deploy in Dokploy
2. Watch logs — should see "Server running on port 3000"
3. Open https://autohorario.axelvd.dev
4. Log in, add a medication, verify the weekly schedule table and PNG download work

---

## Self-Review Checklist

**Spec coverage:**

| Requirement | Task |
|-------------|------|
| Login sencillo con 3 usuarios | Task 4 (routes), Task 6 (Login page) |
| CRUD de medicamentos con formulario | Task 8 (Medications page + MedForm) |
| Control de pastillas restantes | Task 2 (takeDose), Task 7 (Dashboard) |
| Hasta qué día hay medicamento | Task 7 (getEndDate), Task 8 (MedCard) |
| Auto-sugerencia de horario | Task 3 (scheduler), Task 4 (POST /medications) |
| Condición: ayunas/antes/después | Task 3 (scheduler), Task 8 (MedForm) |
| Horario semanal tabla 7 días | Task 9 (ScheduleTable) |
| Descarga como PNG | Task 9 (html2canvas) |
| Alerta de medicamentos por terminar | Task 7 (Dashboard, lowMeds) |
| Docker + Dokploy | Task 10 + Task 11 |

All requirements covered. No gaps found.
