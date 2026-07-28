import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { PrecoMedicamento } from '../entidades/precoMedicamento';

function colecaoPrecos(familiaId: string) {
  return collection(db, 'familias', familiaId, 'precos_medicamentos');
}

export async function listarPrecosMedicamento(
  familiaId: string,
  membroId: string,
): Promise<PrecoMedicamento[]> {
  const consulta = query(
    colecaoPrecos(familiaId),
    where('membro_id', '==', membroId),
  );
  const snap = await getDocs(consulta);
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as PrecoMedicamento)
    .sort((a, b) => b.comprado_em.localeCompare(a.comprado_em));
}

/**
 * Preços são eventos append-only: uma nova nota sempre gera uma nova observação.
 * Correções futuras devem ser auditáveis, nunca sobrescrever silenciosamente o histórico.
 */
export async function registrarPrecoMedicamento(
  familiaId: string,
  preco: Omit<PrecoMedicamento, 'id' | 'criado_em'> & { id?: string },
): Promise<string> {
  const referencia = preco.id
    ? doc(colecaoPrecos(familiaId), preco.id)
    : doc(colecaoPrecos(familiaId));
  const dados: PrecoMedicamento = {
    ...preco,
    id: referencia.id,
    criado_em: new Date().toISOString(),
  };
  await setDoc(referencia, JSON.parse(JSON.stringify(dados)));
  return referencia.id;
}
