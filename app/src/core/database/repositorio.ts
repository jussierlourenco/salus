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

import { collection, getDocs, doc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { CaixaEntradaItem } from '../../modulos/caixa-entrada/entidades/caixaEntrada';

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

export async function vincularDocumentosExistentes(familiaId: string): Promise<number> {
  const ceSnap = await getDocs(query(
    collection(db, 'familias', familiaId, 'caixa_entrada'),
    where('storage_id', '!=', null),
    where('status', '==', 'confirmado'),
  ));

  let vinculados = 0;

  for (const ceDoc of ceSnap.docs) {
    const item = ceDoc.data() as CaixaEntradaItem;
    const storageId = item.storage_id;
    if (!storageId || !item.proposta?.exames?.length) continue;

    for (const exProposta of item.proposta.exames) {
      if (!exProposta.membro_id || !exProposta.marcador) continue;

      const exSnap = await getDocs(query(
        collection(db, 'familias', familiaId, 'exames'),
        where('membro_id', '==', exProposta.membro_id),
        where('marcador', '==', exProposta.marcador),
        where('data', '==', exProposta.data ?? ''),
      ));

      for (const exDoc of exSnap.docs) {
        const exData = exDoc.data();
        if (exData.documento_id) continue;
        await updateDoc(doc(db, 'familias', familiaId, 'exames', exDoc.id), {
          documento_id: storageId,
        });
        vinculados++;
      }
    }
  }

  return vinculados;
}
