import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../database/firebase';
import type { ConfigUsuario, ConfigProvedorIA } from '../../types/dominio';
import { criarProvedor } from '../ia/interface';

const CONFIG_DOC = 'geral';

function docConfig(familiaId: string) {
  return doc(db, 'familias', familiaId, 'config', CONFIG_DOC);
}

export const CONFIG_PADRAO: ConfigUsuario = {
  onboarding_concluido: false,
  consentimentos: {
    lgpd: true,
    disclaimer_clinico: true,
    dados_terceiros: true,
  },
  versao_consentimento: 0,
};

const MODELOS_DEPRECIADOS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

export async function obterConfigUsuario(familiaId: string): Promise<ConfigUsuario> {
  try {
    const snap = await getDoc(docConfig(familiaId));
    if (snap.exists()) {
      const config = { ...CONFIG_PADRAO, ...snap.data() } as ConfigUsuario;

      // Migração automática: modelo deprecated → gemini-2.5-flash
      if (
        config.provedor_ia &&
        MODELOS_DEPRECIADOS.includes(config.provedor_ia.modelo)
      ) {
        config.provedor_ia = { ...config.provedor_ia, modelo: 'gemini-2.5-flash' };
        // Salva a correção no Firestore em segundo plano
        salvarConfigUsuario(familiaId, config).catch(() => {});
      }

      return config;
    }
  } catch (err) {
    console.warn('[Config] Erro ao carregar do Firestore, usando padrão:', err);
  }
  return CONFIG_PADRAO;
}

export async function salvarConfigUsuario(familiaId: string, config: Partial<ConfigUsuario>): Promise<void> {
  const ref = docConfig(familiaId);
  const payload = {
    ...config,
    atualizado_em: new Date().toISOString(),
  };

  const payloadLimpo = JSON.parse(JSON.stringify(payload));
  await setDoc(ref, payloadLimpo, { merge: true });
}

export async function testarConexaoIA(configIA: ConfigProvedorIA): Promise<{ ok: boolean; mensagem: string }> {
  if (!configIA.chave || !configIA.chave.trim()) {
    return { ok: false, mensagem: 'Informe uma chave de API válida.' };
  }

  try {
    const provedor = criarProvedor(configIA);
    const resposta = await provedor.chat(
      [{ papel: 'usuario', conteudo: 'Responda apenas com a palavra OK.' }],
      'Teste de conexão do sistema Salus.'
    );

    if (resposta.conteudo && resposta.conteudo.length > 0) {
      return { ok: true, mensagem: 'Conexão estabelecida com sucesso!' };
    }
    return { ok: false, mensagem: 'O provedor não retornou resposta.' };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, mensagem: `Falha na conexão: ${errorMsg}` };
  }
}

export async function apagarTodosDadosUsuario(familiaId: string): Promise<void> {
  const colecoes = ['membros', 'medicamentos', 'exames', 'vacinas', 'eventos', 'caixa_entrada', 'config'];

  for (const colNome of colecoes) {
    const colRef = collection(db, 'familias', familiaId, colNome);
    const snap = await getDocs(colRef);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }
}
