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
