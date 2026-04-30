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
  return updateMedication(userId, id, { pillsRemaining: med.pillsRemaining - 1, lastTakenAt: new Date().toISOString() });
}

module.exports = { getUsers, getMedications, addMedication, updateMedication, deleteMedication, takeDose };
