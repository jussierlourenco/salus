import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { Exame } from '../entidades/exame';

function colecaoExames(uid: string) {
  return collection(db, 'usuarios', uid, 'exames');
}

function docExame(uid: string, id: string) {
  return doc(db, 'usuarios', uid, 'exames', id);
}

export async function listarExames(uid: string, membroId?: string): Promise<Exame[]> {
  const snap = await getDocs(colecaoExames(uid));
  const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Exame);
  if (membroId) return todos.filter((e) => e.membro_id === membroId);
  return todos;
}

export async function salvarExame(uid: string, exame: Partial<Exame> & { id?: string }): Promise<string> {
  const id = exame.id ?? doc(colecaoExames(uid)).id;
  const agora = new Date().toISOString();
  const dados = JSON.parse(JSON.stringify({
    ...exame,
    id,
    criado_em: exame.criado_em ?? agora,
  }));
  await setDoc(docExame(uid, id), dados, { merge: true });
  return id;
}

export async function excluirExame(uid: string, id: string): Promise<void> {
  await deleteDoc(docExame(uid, id));
}
