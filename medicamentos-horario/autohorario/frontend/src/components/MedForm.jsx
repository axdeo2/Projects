import { useState } from 'react';

const CONDITIONS = [
  { value: 'fasting', label: 'En ayunas' },
  { value: 'before_meal', label: 'Antes de comer' },
  { value: 'after_meal', label: 'Después de comer' },
  { value: 'any', label: 'Sin restricción' },
];

const FREQUENCY_SUGGESTIONS = [4, 6, 8, 12, 24, 48, 72];

export default function MedForm({ initial, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    name: initial?.name || '',
    dose: initial?.dose || '',
    frequencyHours: initial?.frequencyHours || 8,
    condition: initial?.condition || 'any',
    totalPills: initial?.totalPills || '',
    startDate: initial?.startDate || today,
    startHour: initial?.suggestedStartHour ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, frequencyHours: Number(form.frequencyHours), totalPills: Number(form.totalPills) };
      if (form.startHour !== '') payload.startHour = Number(form.startHour);
      else delete payload.startHour;
      await onSave(payload);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">{initial ? 'Editar medicamento' : 'Agregar medicamento'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input required value={form.name} onChange={set('name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Amoxicilina" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dosis</label>
            <input required value={form.dose} onChange={set('dose')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: 500mg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cada cuántas horas</label>
            <input
              required
              type="number"
              min="1"
              max="168"
              value={form.frequencyHours}
              onChange={set('frequencyHours')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 8"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {FREQUENCY_SUGGESTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, frequencyHours: f }))}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${Number(form.frequencyHours) === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                >
                  {f}h
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Condición de toma</label>
            <select value={form.condition} onChange={set('condition')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total de pastillas/dosis</label>
            <input required type="number" min="1" value={form.totalPills} onChange={set('totalPills')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: 21" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de inicio</label>
            <input required type="date" value={form.startDate} onChange={set('startDate')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Hora de inicio <span className="text-gray-400 font-normal">(opcional — si no pones, se sugiere automáticamente)</span>
            </label>
            <input
              type="number"
              min="0"
              max="23"
              value={form.startHour}
              onChange={set('startHour')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 8 (para 08:00)"
            />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
