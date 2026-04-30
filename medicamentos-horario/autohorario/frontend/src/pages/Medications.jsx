import { useState, useEffect, useCallback } from 'react';
import { getMedications, addMedication, updateMedication, deleteMedication } from '../api';
import MedCard from '../components/MedCard';
import MedForm from '../components/MedForm';

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getMedications();
      setMedications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(formData) {
    if (editing) {
      await updateMedication(editing.id, formData);
    } else {
      await addMedication(formData);
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este medicamento?')) return;
    await deleteMedication(id);
    load();
  }

  function handleEdit(med) {
    setEditing(med);
    setShowForm(true);
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mis medicamentos</h1>
          <p className="text-sm text-gray-500">{medications.filter((m) => m.active).length} activos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Agregar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : medications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">💊</p>
          <p className="text-sm">No tienes medicamentos registrados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {medications.map((med) => (
            <MedCard key={med.id} med={med} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <MedForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
