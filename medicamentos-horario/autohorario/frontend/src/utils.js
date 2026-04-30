// Returns the Date object of every dose that falls on a given calendar date.
export function getDosesOnDate(med, date) {
  const startDt = new Date(med.startDate + 'T00:00:00');
  startDt.setHours(med.suggestedStartHour, med.suggestedStartMinute || 0, 0, 0);

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  if (dayEnd < startDt) return [];

  const msPerCycle = med.frequencyHours * 60 * 60 * 1000;
  const msSinceStart = dayStart - startDt;
  // First cycle index that could land on or after dayStart
  const firstCycle = Math.max(0, Math.ceil(msSinceStart / msPerCycle));

  const doses = [];
  let doseTime = new Date(startDt.getTime() + firstCycle * msPerCycle);
  while (doseTime <= dayEnd) {
    doses.push(new Date(doseTime));
    doseTime = new Date(doseTime.getTime() + msPerCycle);
  }
  return doses;
}

// Returns the next scheduled dose Date from now.
export function getNextDose(med) {
  const startDt = new Date(med.startDate + 'T00:00:00');
  startDt.setHours(med.suggestedStartHour, med.suggestedStartMinute || 0, 0, 0);

  const now = new Date();
  if (now <= startDt) return startDt;

  const msPerCycle = med.frequencyHours * 60 * 60 * 1000;
  const msSinceStart = now - startDt;
  const cyclesPassed = Math.floor(msSinceStart / msPerCycle);
  return new Date(startDt.getTime() + (cyclesPassed + 1) * msPerCycle);
}

// Human-readable label for next dose: "hoy a las 08:00", "mañana a las 08:00", "03/05 a las 08:00"
export function formatNextDose(med) {
  const next = getNextDose(med);
  const now = new Date();

  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1);
  const dayAfterStart = new Date(tomorrowStart); dayAfterStart.setDate(tomorrowStart.getDate() + 1);

  const timeStr = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;

  if (next < tomorrowStart) return `hoy a las ${timeStr}`;
  if (next < dayAfterStart) return `mañana a las ${timeStr}`;
  return `${next.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })} a las ${timeStr}`;
}

export function isNextDoseToday(med) {
  const next = getNextDose(med);
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setHours(0, 0, 0, 0);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  return next < tomorrowStart;
}

export function getEndDate(med) {
  if (med.pillsRemaining === 0) return null;
  const dosesPerDay = 24 / med.frequencyHours;
  const days = Math.ceil(med.pillsRemaining / dosesPerDay);
  const end = new Date();
  end.setDate(end.getDate() + days);
  return end.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function daysLeft(med) {
  if (med.pillsRemaining === 0) return 0;
  return Math.ceil(med.pillsRemaining / (24 / med.frequencyHours));
}
