import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { ConfigUsuario, ConfigProvedorIA } from '../../types/dominio';
import {
  obterConfigUsuario,
  salvarConfigUsuario,
  testarConexaoIA,
  apagarTodosDadosUsuario,
  CONFIG_PADRAO,
} from './configuracao';
import {
  listarMembros,
  listarMedicamentos,
  listarExames,
  listarVacinas,
  listarEventos,
} from '../database/repositorio';
import { exportarParaZip, baixarArquivo } from '../storage/exportImport';

const STORAGE_KEY = 'salus_config_usuario';

/**
 * localStorage é só cache de leitura (evita flash de UI vazia); nunca deve reter
 * segredos (chave de IA, refresh_token do Drive) além da sessão em memória.
 */
function paraCacheSemSegredos(config: ConfigUsuario): ConfigUsuario {
  const { drive_refresh_token: _t, ...resto } = config;
  return {
    ...resto,
    provedor_ia: config.provedor_ia ? { ...config.provedor_ia, chave: '' } : config.provedor_ia,
  };
}

interface ConfigContexto {
  config: ConfigUsuario;
  carregando: boolean;
  salvarConfigIA: (configIA: ConfigProvedorIA | null) => Promise<void>;
  salvarConfigDrive: (driveConfig: { token?: string; pasta_id?: string; conectado: boolean }) => Promise<void>;
  testarIA: (configIA: ConfigProvedorIA) => Promise<{ ok: boolean; mensagem: string }>;
  exportarDadosZip: () => Promise<void>;
  apagarConta: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContexto | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [config, setConfig] = useState<ConfigUsuario>(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) return JSON.parse(local);
    } catch (e) {
      console.warn('[ConfigContext] Falha ao ler localStorage:', e);
    }
    return CONFIG_PADRAO;
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!usuario) {
        setCarregando(false);
        return;
      }
      setCarregando(true);
      const remoto = await obterConfigUsuario(usuario.uid);
      if (ativo) {
        setConfig(remoto);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(paraCacheSemSegredos(remoto)));
        } catch (e) {
          console.warn('[ConfigContext] Falha ao salvar no localStorage:', e);
        }
        setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [usuario]);

  const salvarConfigIA = async (configIA: ConfigProvedorIA | null) => {
    const nova: ConfigUsuario = {
      ...config,
      provedor_ia: configIA ?? undefined,
    };
    setConfig(nova);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(paraCacheSemSegredos(nova)));
    } catch (e) {
      console.warn('[ConfigContext] Falha ao salvar no localStorage:', e);
    }

    if (usuario) {
      await salvarConfigUsuario(usuario.uid, nova);
    }
  };

  const salvarConfigDrive = async (driveConfig: { token?: string; pasta_id?: string; conectado: boolean }) => {
    const nova: ConfigUsuario = {
      ...config,
      drive_refresh_token: driveConfig.token || undefined,
      drive_pasta_raiz_id: driveConfig.pasta_id || undefined,
      drive_conectado: driveConfig.conectado,
    };
    setConfig(nova);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(paraCacheSemSegredos(nova)));
    } catch (e) {
      console.warn('[ConfigContext] Falha ao salvar no localStorage:', e);
    }

    if (usuario) {
      await salvarConfigUsuario(usuario.uid, nova);
    }
  };

  const testarIA = async (configIA: ConfigProvedorIA) => {
    return await testarConexaoIA(configIA);
  };

  const exportarDadosZip = async () => {
    const uid = usuario?.uid ?? 'anonimo';
    const [membros, medicamentos, exames, vacinas, eventos] = await Promise.all([
      usuario ? listarMembros(uid) : Promise.resolve([]),
      usuario ? listarMedicamentos(uid) : Promise.resolve([]),
      usuario ? listarExames(uid) : Promise.resolve([]),
      usuario ? listarVacinas(uid) : Promise.resolve([]),
      usuario ? listarEventos(uid) : Promise.resolve([]),
    ]);

    const blob = await exportarParaZip({
      membros,
      medicamentos,
      exames,
      vacinas,
      eventos,
    });

    const dataHoje = new Date().toISOString().split('T')[0];
    baixarArquivo(blob, `salus-export-${dataHoje}.zip`);
  };

  const apagarConta = async () => {
    if (usuario) {
      await apagarTodosDadosUsuario(usuario.uid);
    }
    localStorage.removeItem(STORAGE_KEY);
    setConfig(CONFIG_PADRAO);
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        carregando,
        salvarConfigIA,
        salvarConfigDrive,
        testarIA,
        exportarDadosZip,
        apagarConta,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfiguracao() {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error('useConfiguracao deve ser usado dentro de um ConfigProvider');
  }
  return ctx;
}
