import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { Medicamento } from '../entidades/medicamento';

function colecaoMedicamentos(familiaId: string) {
  return collection(db, 'familias', familiaId, 'medicamentos');
}

function docMedicamento(familiaId: string, id: string) {
  return doc(db, 'familias', familiaId, 'medicamentos', id);
}

export async function listarMedicamentos(familiaId: string, membroId?: string): Promise<Medicamento[]> {
  if (membroId) {
    const q = query(colecaoMedicamentos(familiaId), where('membro_id', '==', membroId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Medicamento);
  }
  const snap = await getDocs(colecaoMedicamentos(familiaId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Medicamento);
}

export async function salvarMedicamento(familiaId: string, med: Partial<Medicamento> & { id?: string }): Promise<string> {
  const id = med.id ?? doc(colecaoMedicamentos(familiaId)).id;
  const agora = new Date().toISOString();
  const dados = JSON.parse(JSON.stringify({
    ...med,
    id,
    criado_em: med.criado_em ?? agora,
    atualizado_em: agora,
  }));
  await setDoc(docMedicamento(familiaId, id), dados, { merge: true });
  return id;
}

export async function excluirMedicamento(familiaId: string, id: string): Promise<void> {
  await deleteDoc(docMedicamento(familiaId, id));
}
