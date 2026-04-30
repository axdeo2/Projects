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
