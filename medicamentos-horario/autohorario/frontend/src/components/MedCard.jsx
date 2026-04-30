import { getEndDate } from '../utils';

const CONDITION_LABELS = {
  fasting: 'En ayunas',
  before_meal: 'Antes de comer',
  after_meal: 'Después de comer',
  any: 'Sin restricción',
};

export default function MedCard({ med, onEdit, onDelete }) {
  const endDate = getEndDate(med) || 'Agotado';
  const isLow = med.pillsRemaining <= 3 * (24 / med.frequencyHours);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-800">{med.name}</h3>
          <p className="text-sm text-gray-500">{med.dose} · cada {med.frequencyHours}h</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(med)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Editar</button>
          <button onClick={() => onDelete(med.id)} className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Eliminar</button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="bg-gray-100 px-2 py-0.5 rounded-full">{CONDITION_LABELS[med.condition]}</span>
        <span>Hora sugerida: <strong>{String(med.suggestedStartHour).padStart(2, '0')}:00</strong></span>
      </div>
      <div className={`flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-100 ${isLow ? 'text-amber-600' : 'text-gray-500'}`}>
        <span>{isLow ? '⚠️' : '💊'} {med.pillsRemaining} pastillas restantes</span>
        <span>Hasta {endDate}</span>
      </div>
    </div>
  );
}
