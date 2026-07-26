import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './core/auth/AuthProvider';
import { ConfigProvider } from './core/config/ConfigContext';
import { AppShell } from './core/ui/AppShell';
import { Carregando } from './core/ui';
import { Login } from './telas/Login';
import { Onboarding } from './telas/Onboarding';
import { Painel } from './telas/Painel';
import { Membros } from './telas/Membros';
import { CaixaDeEntrada } from './telas/CaixaDeEntrada';
import { Perfil } from './telas/Perfil';
import { Chat } from './telas/Chat';
import { Ajustes } from './telas/Ajustes';
import { AguardandoAprovacao } from './telas/AguardandoAprovacao';
import { AdminUsuarios } from './telas/AdminUsuarios';

function GuardaAuth({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Carregando texto="Carregando..." tamanho="lg" />;
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuardaAprovacao({ children }: { children: React.ReactNode }) {
  const { usuario, usuarioSalus, carregando, carregandoUsuarioSalus } = useAuth();
  if (carregando || carregandoUsuarioSalus) return <Carregando texto="Verificando acesso..." tamanho="lg" />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!usuarioSalus) return <Carregando texto="Preparando cadastro..." tamanho="lg" />;
  if (usuarioSalus.status === 'pending' || usuarioSalus.status === 'denied') {
    return <Navigate to="/aguardando" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/aguardando" element={<GuardaAuth><AguardandoAprovacao /></GuardaAuth>} />
            <Route path="/onboarding" element={
              <GuardaAuth><GuardaAprovacao><Onboarding /></GuardaAprovacao></GuardaAuth>
            } />
            <Route element={<GuardaAuth><GuardaAprovacao><AppShell /></GuardaAprovacao></GuardaAuth>}>
              <Route index element={<Painel />} />
              <Route path="membros" element={<Membros />} />
              <Route path="membro/:id" element={<Perfil />} />
              <Route path="caixa-de-entrada" element={<CaixaDeEntrada />} />
              <Route path="chat" element={<Chat />} />
              <Route path="ajustes" element={<Ajustes />} />
              <Route path="admin/usuarios" element={<AdminUsuarios />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
