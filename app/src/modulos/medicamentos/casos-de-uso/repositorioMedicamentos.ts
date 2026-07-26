import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { Medicamento } from '../entidades/medicamento';

function colecaoMedicamentos(uid: string) {
  return collection(db, 'usuarios', uid, 'medicamentos');
}

function docMedicamento(uid: string, id: string) {
  return doc(db, 'usuarios', uid, 'medicamentos', id);
}

export async function listarMedicamentos(uid: string, membroId?: string): Promise<Medicamento[]> {
  const snap = await getDocs(colecaoMedicamentos(uid));
  const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Medicamento);
  if (membroId) return todos.filter((m) => m.membro_id === membroId);
  return todos;
}

export async function salvarMedicamento(uid: string, med: Partial<Medicamento> & { id?: string }): Promise<string> {
  const id = med.id ?? doc(colecaoMedicamentos(uid)).id;
  const agora = new Date().toISOString();
  const dados = JSON.parse(JSON.stringify({
    ...med,
    id,
    criado_em: med.criado_em ?? agora,
    atualizado_em: agora,
  }));
  await setDoc(docMedicamento(uid, id), dados, { merge: true });
  return id;
}

export async function excluirMedicamento(uid: string, id: string): Promise<void> {
  await deleteDoc(docMedicamento(uid, id));
}
