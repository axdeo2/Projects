import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { getMedications } from '../api';
import ScheduleTable from '../components/ScheduleTable';

export default function WeeklySchedule() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const tableRef = useRef(null);

  useEffect(() => {
    getMedications().then(setMedications).finally(() => setLoading(false));
  }, []);

  async function handleDownload() {
    if (!tableRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `horario-semana-${new Date().toISOString().split('T')[0]}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Horario semanal</h1>
          <p className="text-sm text-gray-500">Semana actual</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || loading || medications.filter((m) => m.active).length === 0}
          className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {downloading ? 'Generando...' : '⬇ Descargar imagen'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : medications.filter((m) => m.active).length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">No tienes medicamentos activos para mostrar en el horario.</p>
        </div>
      ) : (
        <ScheduleTable ref={tableRef} medications={medications} />
      )}
    </div>
  );
}
