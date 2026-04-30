import { useState } from 'react';
import { takeDose } from '../api';

const CONDITION_LABELS = {
  fasting: { label: 'En ayunas', color: 'bg-yellow-100 text-yellow-800' },
  before_meal: { label: 'Antes de comer', color: 'bg-orange-100 text-orange-800' },
  after_meal: { label: 'Después de comer', color: 'bg-green-100 text-green-800' },
  any: { label: 'Sin restricción', color: 'bg-gray-100 text-gray-600' },
};

export default function DoseItem({ med, time, taken, onTaken }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const condition = CONDITION_LABELS[med.condition] || CONDITION_LABELS.any;
  const canTake = med.pillsRemaining > 0 && !taken;

  async function handleTake() {
    setError('');
    setLoading(true);
    try {
      await takeDose(med.id);
      onTaken();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl font-bold text-blue-600 w-16 shrink-0">{time}</span>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{med.name}</p>
          <p className="text-xs text-gray-500">{med.dose}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${condition.color}`}>{condition.label}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {taken ? (
          <span className="text-xs bg-green-100 text-green-700 rounded-lg px-3 py-1.5 font-medium">
            Tomada ✓
          </span>
        ) : (
          <button
            onClick={handleTake}
            disabled={!canTake || loading}
            className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '...' : med.pillsRemaining > 0 ? 'Tomé esta dosis' : `Sin ${med.unit || 'pastilla'}s`}
          </button>
        )}
        <p className="text-xs text-gray-400">{med.pillsRemaining} {med.unit || 'pastilla'}(s) restantes</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
