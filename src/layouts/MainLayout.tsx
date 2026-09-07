import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Gift, LogOut, Play, Settings, Music } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Estudio Multimedia', path: '/', icon: LayoutDashboard },
    { name: 'Regalos Personalizados', path: '/gifts', icon: Gift },
  ];

  return (
    <div className="flex h-screen bg-[#F5EADC] text-neutral-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#8B1F32]/10 flex flex-col z-20 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-neutral-50">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#8B1F32]/10 border border-[#8B1F32]/20 shadow-sm">
              <Music className="w-4 h-4 text-[#8B1F32]" />
            </div>
            <span className="text-lg font-serif font-bold text-neutral-900 tracking-tight">Cursea Digital</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-[#8B1F32] text-white shadow-lg shadow-[#8B1F32]/20'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-[#F5EADC]/40'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span className="font-bold text-xs uppercase tracking-widest">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 rounded-2xl hover:text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
