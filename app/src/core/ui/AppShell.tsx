import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  MessageCircle,
  Settings,
  LogOut,
  Stethoscope,
  Users,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useTema } from './useTema';
import { useAlertas } from '../../dominio/useAlertas';

const links = [
  { to: '/', label: 'Painel', icone: LayoutDashboard, badge: 'alertas' as const },
  { to: '/membros', label: 'Membros', icone: Users },
  { to: '/caixa-de-entrada', label: 'Entrada', icone: Inbox },
  { to: '/chat', label: 'Chat', icone: MessageCircle },
  { to: '/ajustes', label: 'Ajustes', icone: Settings },
];

function NavItem({ to, label, icone: Icone, contagem }: typeof links[number] & { contagem?: number }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] touch-target relative
         transition-all duration-200 text-sm font-medium
         ${isActive
          ? 'bg-salus-600/15 text-salus-400 border border-salus-600/30'
          : 'text-texto-secundario hover:text-texto hover:bg-fundo-elevado/50 border border-transparent'
        }`
      }
    >
      <span className="relative">
        <Icone size={20} />
        {!!contagem && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-vencido-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {contagem > 9 ? '9+' : contagem}
          </span>
        )}
      </span>
      <span className="hidden lg:inline">{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { usuario, usuarioSalus, sair } = useAuth();
  const { tema, alternarTema } = useTema();
  const isAdmin = usuarioSalus?.admin === true;
  const alertas = useAlertas();

  const adminLink = { to: '/admin/usuarios', label: 'Admin', icone: Shield, badge: undefined };

  return (
    <div className="flex flex-col lg:flex-row h-dvh">
      {/* ── Sidebar Desktop ── */}
      <aside className="hidden lg:flex flex-col w-64 lg:w-72 border-r border-borda bg-fundo-card/50 p-4">
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
            <NavItem key={link.to} {...link} contagem={link.badge === 'alertas' ? alertas.length : undefined} />
          ))}
          {isAdmin && <NavItem key={adminLink.to} {...adminLink} />}
        </nav>

        {/* Tema */}
        <button
          onClick={alternarTema}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] touch-target
                     text-sm font-medium text-texto-secundario hover:text-texto hover:bg-fundo-elevado/50
                     border border-transparent transition-all duration-200"
        >
          {tema === 'escuro' ? <Sun size={20} /> : <Moon size={20} />}
          <span className="hidden lg:inline">{tema === 'escuro' ? 'Modo claro' : 'Modo escuro'}</span>
        </button>

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

      {/* ── Main Column (mobile: column, desktop: fills sidebar row) ── */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Content */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 overflow-y-auto">
            <Outlet />
          </div>
        </main>

        {/* ── Disclaimer Desktop ── */}
        <footer className="hidden lg:block border-t border-borda px-4 py-2.5 text-center">
          <p className="text-[11px] text-texto-secundario/60">
            O Salus organiza informações de saúde. Ele não diagnostica, não prescreve e não substitui médico ou veterinário.
          </p>
        </footer>

        {/* ── Bottom Nav (in document flow — no overlap) ── */}
        <nav className="lg:hidden bg-fundo">
          <div className="glass border-t border-borda flex items-center justify-around px-1 py-1 pb-[env(safe-area-inset-bottom,0px)]">
            {[...links, ...(isAdmin ? [adminLink] : [])].map(({ to, label, icone: Icone, badge }) => {
              const contagem = badge === 'alertas' ? alertas.length : 0;
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-2 px-3 rounded-[var(--radius-sm)]
                     transition-all duration-200 touch-target relative min-w-[56px]
                     ${isActive ? 'text-salus-400' : 'text-texto-secundario active:text-salus-400'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative">
                        <Icone size={20} />
                        {contagem > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-vencido-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                            {contagem > 9 ? '9+' : contagem}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-medium leading-none">{label}</span>
                      {isActive && (
                        <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-salus-400 rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
