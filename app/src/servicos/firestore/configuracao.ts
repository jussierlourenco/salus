/**
 * Serviço para gerenciamento de configurações do usuário e validação de provedor de IA.
 */

import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../data/firebase';
import type { ConfigUsuario, ConfigProvedorIA } from '../../types/dominio';
import { criarProvedor } from '../ia/interface';

const CONFIG_DOC = 'geral';

function docConfig(uid: string) {
  return doc(db, 'usuarios', uid, 'config', CONFIG_DOC);
}

export const CONFIG_PADRAO: ConfigUsuario = {
  onboarding_concluido: false,
  consentimentos: {
    lgpd: true,
    disclaimer_clinico: true,
    dados_terceiros: true,
  },
};

/**
 * Obtém as configurações do usuário no Firestore.
 */
export async function obterConfigUsuario(uid: string): Promise<ConfigUsuario> {
  try {
    const snap = await getDoc(docConfig(uid));
    if (snap.exists()) {
      return { ...CONFIG_PADRAO, ...snap.data() } as ConfigUsuario;
    }
  } catch (err) {
    console.warn('[Config] Erro ao carregar do Firestore, usando padrão:', err);
  }
  return CONFIG_PADRAO;
}

/**
 * Salva as configurações do usuário no Firestore.
 * Sanitiza automaticamente propriedades `undefined` incompatíveis com Firestore.
 */
export async function salvarConfigUsuario(uid: string, config: Partial<ConfigUsuario>): Promise<void> {
  const ref = docConfig(uid);
  const payload = {
    ...config,
    atualizado_em: new Date().toISOString(),
  };

  // Transforma em JSON string e parse para expurgar chaves com valor `undefined`
  const payloadLimpo = JSON.parse(JSON.stringify(payload));
  await setDoc(ref, payloadLimpo, { merge: true });
}

/**
 * Testa a conexão com a API do Provedor de IA configurado.
 */
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

/**
 * Apaga todos os documentos de todas as coleções do usuário.
 */
export async function apagarTodosDadosUsuario(uid: string): Promise<void> {
  const colecoes = ['membros', 'medicamentos', 'exames', 'vacinas', 'eventos', 'caixa_entrada', 'config'];

  for (const colNome of colecoes) {
    const colRef = collection(db, 'usuarios', uid, colNome);
    const snap = await getDocs(colRef);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }
}
