import { forwardRef } from 'react';
import { getDosesOnDate } from '../utils';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00
const COLORS = ['bg-blue-200 text-blue-900', 'bg-green-200 text-green-900', 'bg-purple-200 text-purple-900', 'bg-rose-200 text-rose-900', 'bg-amber-200 text-amber-900', 'bg-teal-200 text-teal-900'];
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getWeekDays(weekOffset = 0) {
  const today = new Date();
  const day = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((day === 0 ? 7 : day) - 1) + weekOffset * 7);
  mon.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function getMedDoseHours(med, date) {
  return getDosesOnDate(med, date).map((d) => d.getHours());
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const ScheduleTable = forwardRef(function ScheduleTable({ medications, weekOffset = 0 }, ref) {
  const weekDays = getWeekDays(weekOffset);
  const activeMeds = medications.filter((m) => m.active);
  const today = new Date();

  return (
    <div ref={ref} className="bg-white rounded-xl border border-gray-200 overflow-auto">
      <table className="w-full text-xs border-collapse min-w-[500px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-2 py-1 text-left w-14 text-gray-500 font-medium">Hora</th>
            {weekDays.map((d, i) => {
              const isToday = isSameDay(d, today);
              return (
                <th key={i} className={`border border-gray-200 px-1 py-1 text-center font-medium ${isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                  <div>{DAY_LABELS[i]}</div>
                  <div className={`font-normal ${isToday ? 'text-blue-500' : 'text-gray-400'}`}>
                    {d.getDate()}/{d.getMonth() + 1}
                    {isToday && <span className="ml-1 text-[9px] bg-blue-600 text-white rounded px-1">hoy</span>}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-2 py-1 text-gray-400 font-mono">{String(hour).padStart(2, '0')}:00</td>
              {weekDays.map((date, di) => {
                const isToday = isSameDay(date, today);
                const medsThisSlot = activeMeds.filter((m) => getMedDoseHours(m, date).includes(hour));
                return (
                  <td key={di} className={`border border-gray-200 px-1 py-1 align-top h-8 ${isToday ? 'bg-blue-50/40' : ''}`}>
                    {medsThisSlot.map((m) => (
                      <span key={m.id} className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium truncate max-w-full ${COLORS[activeMeds.indexOf(m) % COLORS.length]}`}>
                        {m.name}
                      </span>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default ScheduleTable;
