import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './core/auth/AuthProvider';
import { ConfigProvider, useConfiguracao } from './core/config/ConfigContext';
import { AppShell } from './core/ui/AppShell';
import { Botao, Carregando } from './core/ui';
import { AlertTriangle, LogOut } from 'lucide-react';
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
import { ConsentimentoLGPD } from './telas/ConsentimentoLGPD';

const VERSAO_CONSENTIMENTO = 1;

function GuardaAuth({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Carregando texto="Carregando..." tamanho="lg" />;
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuardaAprovacao({ children }: { children: React.ReactNode }) {
  const { usuario, usuarioSalus, carregando, carregandoUsuarioSalus, sair } = useAuth();
  if (carregando || carregandoUsuarioSalus) return <Carregando texto="Verificando acesso..." tamanho="lg" />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!usuarioSalus) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <AlertTriangle size={40} className="text-alerta-400 mx-auto" />
          <h2 className="text-xl font-bold text-texto">Erro ao carregar cadastro</h2>
          <p className="text-sm text-texto-secundario">
            Não foi possível carregar seus dados. Isso pode acontecer se o seu cadastro não foi completamente criado.
            Tente novamente ou contate o administrador.
          </p>
          <Botao onClick={() => { sair(); }} variante="secundario" icone={<LogOut size={16} />}>
            Sair e tentar novamente
          </Botao>
        </div>
      </div>
    );
  }
  if (usuarioSalus.status === 'pending' || usuarioSalus.status === 'denied') {
    return <Navigate to="/aguardando" replace />;
  }
  return <>{children}</>;
}

function GuardaLGPD({ children }: { children: React.ReactNode }) {
  const { config, carregando: configCarregando } = useConfiguracao();
  if (configCarregando) return <Carregando texto="Carregando configurações..." tamanho="lg" />;
  if (config.versao_consentimento < VERSAO_CONSENTIMENTO) {
    return <Navigate to="/consentimento-lgpd" replace />;
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
            <Route path="/consentimento-lgpd" element={
              <GuardaAuth><GuardaAprovacao><ConsentimentoLGPD /></GuardaAprovacao></GuardaAuth>
            } />
            <Route path="/onboarding" element={
              <GuardaAuth><GuardaAprovacao><GuardaLGPD><Onboarding /></GuardaLGPD></GuardaAprovacao></GuardaAuth>
            } />
            <Route element={
              <GuardaAuth><GuardaAprovacao><GuardaLGPD><AppShell /></GuardaLGPD></GuardaAprovacao></GuardaAuth>
            }>
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
