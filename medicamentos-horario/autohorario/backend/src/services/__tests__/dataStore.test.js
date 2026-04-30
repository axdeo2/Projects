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
