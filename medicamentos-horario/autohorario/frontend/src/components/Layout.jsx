import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Hoy', icon: '📅' },
  { to: '/medicamentos', label: 'Medicamentos', icon: '💊' },
  { to: '/horario', label: 'Horario', icon: '📋' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <nav className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 p-4 gap-2">
        <p className="text-sm text-gray-500 mb-4">Hola, <strong>{user?.username}</strong></p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <button onClick={handleLogout} className="mt-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50">
          🚪 Salir
        </button>
      </nav>

      <main className="flex-1 p-4 pb-20 md:pb-4">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs gap-0.5 px-3 py-1 rounded-lg ${isActive ? 'text-blue-600' : 'text-gray-500'}`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <button onClick={handleLogout} className="flex flex-col items-center text-xs gap-0.5 px-3 py-1 text-red-400">
          <span className="text-xl">🚪</span>Salir
        </button>
      </nav>
    </div>
  );
}
