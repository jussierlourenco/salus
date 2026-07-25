import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  MessageCircle,
  Settings,
  LogOut,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

const links = [
  { to: '/', label: 'Painel', icone: LayoutDashboard },
  { to: '/membros', label: 'Membros', icone: Users },
  { to: '/caixa-de-entrada', label: 'Entrada', icone: Inbox },
  { to: '/chat', label: 'Chat', icone: MessageCircle },
  { to: '/ajustes', label: 'Ajustes', icone: Settings },
];

function NavItem({ to, label, icone: Icone }: typeof links[number]) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] touch-target
         transition-all duration-200 text-sm font-medium
         ${isActive
          ? 'bg-salus-600/15 text-salus-400 border border-salus-600/30'
          : 'text-texto-secundario hover:text-texto hover:bg-fundo-elevado/50 border border-transparent'
        }`
      }
    >
      <Icone size={20} />
      <span className="hidden lg:inline">{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { usuario, sair } = useAuth();

  return (
    <div className="flex h-dvh">
      {/* ── Sidebar Desktop ── */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-borda bg-fundo-card/50 p-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-gradient-to-br from-salus-500 to-salus-700 flex items-center justify-center shadow-lg shadow-salus-600/20">
            <Stethoscope size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-texto">Salus</h1>
            <p className="text-[10px] text-texto-secundario leading-none">Central de Saúde</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {links.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-borda pt-4 mt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            {usuario?.photoURL ? (
              <img
                src={usuario.photoURL}
                alt=""
                className="w-8 h-8 rounded-full border border-borda"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-salus-700 flex items-center justify-center text-sm font-bold text-white">
                {usuario?.displayName?.[0] ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-texto truncate">
                {usuario?.displayName ?? 'Usuário'}
              </p>
              <p className="text-xs text-texto-secundario truncate">
                {usuario?.email}
              </p>
            </div>
          </div>
          <button
            onClick={sair}
            className="flex items-center gap-2 px-3 py-2 w-full text-sm text-texto-secundario
                       hover:text-vencido-500 rounded-[var(--radius-md)] transition-colors touch-target"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <footer className="hidden md:block border-t border-borda px-4 py-2.5 text-center">
          <p className="text-[11px] text-texto-secundario/60">
            O Salus organiza informações de saúde. Ele não diagnostica, não prescreve e não substitui médico ou veterinário.
          </p>
        </footer>
      </main>

      {/* ── Bottom Nav Mobile ── */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-borda z-50">
        <div className="flex items-center justify-around px-2 py-1">
          {links.map(({ to, label, icone: Icone }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-3 rounded-[var(--radius-sm)]
                 transition-colors touch-target
                 ${isActive ? 'text-salus-400' : 'text-texto-secundario'}`
              }
            >
              <Icone size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
        <p className="text-[9px] text-texto-secundario/40 text-center pb-1 px-4">
          O Salus não diagnostica nem substitui profissional de saúde.
        </p>
      </nav>
    </div>
  );
}
