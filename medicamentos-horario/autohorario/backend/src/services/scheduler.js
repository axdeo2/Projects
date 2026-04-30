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
