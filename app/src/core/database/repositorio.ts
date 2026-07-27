/**
 * Facade de repositórios agregados por compatibilidade.
 * Encapsula as chamadas para os repositórios dos domínios específicos em `src/modulos/`.
 */

export {
  listarMembros,
  buscarMembro,
  salvarMembro,
  excluirMembro,
} from '../../modulos/membros/casos-de-uso/repositorioMembros';

export {
  listarMedicamentos,
  salvarMedicamento,
  excluirMedicamento,
} from '../../modulos/medicamentos/casos-de-uso/repositorioMedicamentos';

export {
  listarExames,
  salvarExame,
  excluirExame,
} from '../../modulos/exames/casos-de-uso/repositorioExames';

export {
  listarVacinas,
  salvarVacina,
  excluirVacina,
} from '../../modulos/vacinas/casos-de-uso/repositorioVacinas';

export {
  listarCaixaEntrada,
  salvarCaixaEntrada,
  atualizarStatusCaixaEntrada,
} from '../../modulos/caixa-entrada/casos-de-uso/repositorioCaixaEntrada';

import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface Evento {
  id: string;
  membro_id: string;
  data: string;
  tipo: string;
  descricao: string;
  profissional?: string;
  local?: string;
  notas?: string;
  criado_em: string;
}

function colecaoEventos(familiaId: string) {
  return collection(db, 'familias', familiaId, 'eventos');
}

export async function listarEventos(familiaId: string, membroId?: string): Promise<Evento[]> {
  if (membroId) {
    const q = query(colecaoEventos(familiaId), where('membro_id', '==', membroId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento);
  }
  const snap = await getDocs(colecaoEventos(familiaId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento);
}

export async function salvarEvento(familiaId: string, evento: Partial<Evento> & { id?: string }): Promise<string> {
  const id = evento.id ?? doc(colecaoEventos(familiaId)).id;
  const agora = new Date().toISOString();
  const dados = JSON.parse(JSON.stringify({
    ...evento,
    id,
    criado_em: evento.criado_em ?? agora,
  }));
  await setDoc(doc(db, 'familias', familiaId, 'eventos', id), dados, { merge: true });
  return id;
}
