import { useState, useEffect, useCallback } from 'react';
import { getMedications } from '../api';
import DoseItem from '../components/DoseItem';
import { getDosesOnDate, getEndDate, daysLeft, formatNextDose, isNextDoseToday } from '../utils';

function getTodayDoses(medications) {
  const today = new Date();
  const doses = [];
  for (const med of medications) {
    if (!med.active) continue;
    for (const doseTime of getDosesOnDate(med, today)) {
      const h = doseTime.getHours();
      const m = doseTime.getMinutes();
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      doses.push({ med, time, sortKey: h * 60 + m });
    }
  }
  return doses.sort((a, b) => a.sortKey - b.sortKey);
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
  const activeMeds = medications.filter((m) => m.active);
  const lowMeds = activeMeds.filter((m) => daysLeft(m) <= 3 && m.pillsRemaining > 0);
  const nextDoseToday = activeMeds.filter((m) => m.pillsRemaining > 0 && isNextDoseToday(m) && doses.every((d) => d.med.id !== m.id));
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

      {nextDoseToday.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <p className="text-sm font-medium text-blue-800">💊 Próxima dosis hoy:</p>
          {nextDoseToday.map((m) => (
            <p key={m.id} className="text-xs text-blue-700 mt-1">{m.name} — {formatNextDose(m)}</p>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : doses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">💊</p>
          <p className="text-sm">No tienes dosis programadas para hoy.</p>
          <p className="text-xs mt-1">Ve a "Medicamentos" para agregar uno.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {doses.map(({ med, time }, i) => (
            <DoseItem key={`${med.id}-${time}-${i}`} med={med} time={time} onTaken={load} />
          ))}
        </div>
      )}

      {activeMeds.length > 0 && (
        <div className="mt-4 flex flex-col gap-1">
          {activeMeds.map((m) => (
            <div key={m.id} className="text-xs text-gray-400 flex justify-between items-center">
              <span className="font-medium text-gray-500">{m.name}</span>
              <span>
                {m.pillsRemaining > 0
                  ? <span>Próxima: <strong className={isNextDoseToday(m) ? 'text-blue-600' : ''}>{formatNextDose(m)}</strong></span>
                  : <span className="text-red-400">Agotado</span>
                }
                {' · '}{m.pillsRemaining} pastillas · hasta {getEndDate(m) || 'agotado'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
