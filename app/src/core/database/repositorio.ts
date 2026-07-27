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
  listarEventos,
  salvarEvento,
  excluirEvento,
} from '../../modulos/eventos/casos-de-uso/repositorioEventos';

export type { Evento } from '../../modulos/eventos/entidades/evento';

export {
  listarCaixaEntrada,
  salvarCaixaEntrada,
  atualizarStatusCaixaEntrada,
} from '../../modulos/caixa-entrada/casos-de-uso/repositorioCaixaEntrada';

import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { CaixaEntradaItem } from '../../modulos/caixa-entrada/entidades/caixaEntrada';

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
