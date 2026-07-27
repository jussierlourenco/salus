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
import { buscarFamilia, sairDaFamilia } from '../database/repositorioFamilias';
import { exportarParaZip, baixarArquivo } from '../storage/exportImport';

const STORAGE_KEY = 'salus_config_usuario';

/**
 * localStorage é só cache de leitura (evita flash de UI vazia); nunca deve reter
 * a chave de IA além da sessão em memória (o access token do Drive nunca é persistido
 * em lugar nenhum — vive só em memória, ver core/storage/googleAuth.ts).
 */
function paraCacheSemSegredos(config: ConfigUsuario): ConfigUsuario {
  return {
    ...config,
    provedor_ia: config.provedor_ia ? { ...config.provedor_ia, chave: '' } : config.provedor_ia,
  };
}

interface ConfigContexto {
  config: ConfigUsuario;
  carregando: boolean;
  refreshConfig: () => Promise<void>;
  salvarConfigIA: (configIA: ConfigProvedorIA | null) => Promise<void>;
  testarIA: (configIA: ConfigProvedorIA) => Promise<{ ok: boolean; mensagem: string }>;
  exportarDadosZip: () => Promise<void>;
  apagarConta: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContexto | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { usuario, familiaId } = useAuth();
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
      if (!usuario || !familiaId) {
        setCarregando(false);
        return;
      }
      setCarregando(true);
      const remoto = await obterConfigUsuario(familiaId);
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
  }, [usuario, familiaId]);

  const refreshConfig = async () => {
    if (!familiaId) return;
    const remoto = await obterConfigUsuario(familiaId);
    setConfig(remoto);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(paraCacheSemSegredos(remoto)));
    } catch (e) {
      console.warn('[ConfigContext] Falha ao salvar no localStorage:', e);
    }
  };

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

    if (familiaId) {
      await salvarConfigUsuario(familiaId, nova);
    }
  };

  const testarIA = async (configIA: ConfigProvedorIA) => {
    return await testarConexaoIA(configIA);
  };

  const exportarDadosZip = async () => {
    const [membros, medicamentos, exames, vacinas, eventos] = await Promise.all([
      familiaId ? listarMembros(familiaId) : Promise.resolve([]),
      familiaId ? listarMedicamentos(familiaId) : Promise.resolve([]),
      familiaId ? listarExames(familiaId) : Promise.resolve([]),
      familiaId ? listarVacinas(familiaId) : Promise.resolve([]),
      familiaId ? listarEventos(familiaId) : Promise.resolve([]),
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
    if (usuario && familiaId) {
      const familia = await buscarFamilia(familiaId);
      if (familia && familia.membros_uids.length > 1) {
        await sairDaFamilia(familiaId, usuario.uid);
      } else {
        await apagarTodosDadosUsuario(familiaId);
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setConfig(CONFIG_PADRAO);
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        carregando,
        refreshConfig,
        salvarConfigIA,
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
