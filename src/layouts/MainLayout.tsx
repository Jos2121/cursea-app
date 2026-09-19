import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Gift, LogOut, Music, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      <aside 
        className={cn(
          "bg-white border-r border-[#8B1F32]/10 flex flex-col z-20 shadow-sm transition-all duration-500 ease-in-out relative",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-[#8B1F32]/20 rounded-full flex items-center justify-center shadow-md text-[#8B1F32] hover:bg-[#8B1F32] hover:text-white transition-all z-30"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={cn(
          "h-16 flex items-center border-b border-neutral-50 overflow-hidden transition-all duration-500",
          isCollapsed ? "px-5" : "px-6"
        )}>
          <div className="flex items-center space-x-3 shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#8B1F32]/10 border border-[#8B1F32]/20 shadow-sm">
              <Music className="w-4 h-4 text-[#8B1F32]" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-serif font-bold text-neutral-900 tracking-tight whitespace-nowrap opacity-100 transition-opacity duration-300">
                Cursea Digital
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-3 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : ""}
                className={cn(
                  "flex items-center rounded-2xl transition-all duration-300 group overflow-hidden",
                  isCollapsed ? "justify-center p-3" : "px-4 py-3",
                  isActive
                    ? 'bg-[#8B1F32] text-white shadow-lg shadow-[#8B1F32]/20'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-[#F5EADC]/40'
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-colors shrink-0",
                  isCollapsed ? "" : "mr-3",
                  isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-600'
                )} />
                {!isCollapsed && (
                  <span className="font-bold text-xs uppercase tracking-widest whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-50">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Cerrar Sesión" : ""}
            className={cn(
              "flex items-center w-full text-[10px] font-bold uppercase tracking-widest text-neutral-400 rounded-2xl hover:text-rose-600 hover:bg-rose-50 transition-all overflow-hidden",
              isCollapsed ? "justify-center p-3" : "px-4 py-3"
            )}
          >
            <LogOut className={cn("w-5 h-5 shrink-0", isCollapsed ? "" : "mr-3")} />
            {!isCollapsed && <span className="whitespace-nowrap">Cerrar Sesión</span>}
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
