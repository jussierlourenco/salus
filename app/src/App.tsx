import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './auth/AuthProvider';
import { AppShell } from './componentes/AppShell';
import { Carregando } from './componentes/ui';
import { Login } from './telas/Login';
import { Onboarding } from './telas/Onboarding';
import { Painel } from './telas/Painel';
import { Membros } from './telas/Membros';
import { CaixaDeEntrada } from './telas/CaixaDeEntrada';
import { Perfil } from './telas/Perfil';
import { Chat } from './telas/Chat';
import { Ajustes } from './telas/Ajustes';

function GuardaAuth({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Carregando texto="Carregando..." tamanho="lg" />;
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={
            <GuardaAuth><Onboarding /></GuardaAuth>
          } />
          <Route element={<GuardaAuth><AppShell /></GuardaAuth>}>
            <Route index element={<Painel />} />
            <Route path="membros" element={<Membros />} />
            <Route path="membro/:id" element={<Perfil />} />
            <Route path="caixa-de-entrada" element={<CaixaDeEntrada />} />
            <Route path="chat" element={<Chat />} />
            <Route path="ajustes" element={<Ajustes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
