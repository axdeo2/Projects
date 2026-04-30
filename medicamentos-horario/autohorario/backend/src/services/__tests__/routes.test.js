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
