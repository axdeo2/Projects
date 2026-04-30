import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { getMedications } from '../api';
import ScheduleTable from '../components/ScheduleTable';
import { daysLeft } from '../utils';

function getWeekLabel(weekOffset) {
  const today = new Date();
  const day = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((day === 0 ? 7 : day) - 1) + weekOffset * 7);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function getMaxWeeks(medications) {
  const maxDays = Math.max(0, ...medications.filter((m) => m.active).map((m) => daysLeft(m)));
  return Math.ceil(maxDays / 7) + 1;
}

export default function WeeklySchedule() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const tableRef = useRef(null);

  useEffect(() => {
    getMedications().then(setMedications).finally(() => setLoading(false));
  }, []);

  const maxWeeks = getMaxWeeks(medications);

  async function handleDownload() {
    if (!tableRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `horario-semana-${getWeekLabel(weekOffset).replace(/\s/g, '-')}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  }

  const activeMeds = medications.filter((m) => m.active);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-bold text-gray-800">Horario semanal</h1>
        <button
          onClick={handleDownload}
          disabled={downloading || loading || activeMeds.length === 0}
          className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {downloading ? 'Generando...' : '⬇ Descargar'}
        </button>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2 mb-4">
        <button
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
          className="text-gray-500 hover:text-gray-800 disabled:opacity-30 text-lg px-2"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">{getWeekLabel(weekOffset)}</p>
          {weekOffset === 0 && <p className="text-xs text-blue-600">Semana actual</p>}
          {weekOffset > 0 && <p className="text-xs text-gray-400">Semana +{weekOffset}</p>}
        </div>
        <button
          onClick={() => setWeekOffset((w) => Math.min(maxWeeks, w + 1))}
          disabled={weekOffset >= maxWeeks}
          className="text-gray-500 hover:text-gray-800 disabled:opacity-30 text-lg px-2"
        >
          ›
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : activeMeds.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">No tienes medicamentos activos.</p>
        </div>
      ) : (
        <ScheduleTable ref={tableRef} medications={medications} weekOffset={weekOffset} />
      )}
    </div>
  );
}
