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

import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../core/database/firebase';

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

function colecaoEventos(uid: string) {
  return collection(db, 'usuarios', uid, 'eventos');
}

export async function listarEventos(uid: string, membroId?: string): Promise<Evento[]> {
  const snap = await getDocs(colecaoEventos(uid));
  const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento);
  if (membroId) return todos.filter((e) => e.membro_id === membroId);
  return todos;
}

export async function salvarEvento(uid: string, evento: Partial<Evento> & { id?: string }): Promise<string> {
  const id = evento.id ?? doc(colecaoEventos(uid)).id;
  const agora = new Date().toISOString();
  const dados = {
    ...evento,
    id,
    criado_em: evento.criado_em ?? agora,
  };
  await setDoc(doc(db, 'usuarios', uid, 'eventos', id), dados, { merge: true });
  return id;
}
