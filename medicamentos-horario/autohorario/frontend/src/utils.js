export function getEndDate(med) {
  if (med.pillsRemaining === 0) return null;
  const dosesPerDay = 24 / med.frequencyHours;
  const daysLeft = Math.ceil(med.pillsRemaining / dosesPerDay);
  const end = new Date();
  end.setDate(end.getDate() + daysLeft);
  return end.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function daysLeft(med) {
  if (med.pillsRemaining === 0) return 0;
  return Math.ceil(med.pillsRemaining / (24 / med.frequencyHours));
}
