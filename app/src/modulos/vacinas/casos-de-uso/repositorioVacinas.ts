import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { Vacina } from '../entidades/vacina';

function colecaoVacinas(uid: string) {
  return collection(db, 'usuarios', uid, 'vacinas');
}

function docVacina(uid: string, id: string) {
  return doc(db, 'usuarios', uid, 'vacinas', id);
}

export async function listarVacinas(uid: string, membroId?: string): Promise<Vacina[]> {
  const snap = await getDocs(colecaoVacinas(uid));
  const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Vacina);
  if (membroId) return todos.filter((v) => v.membro_id === membroId);
  return todos;
}

export async function salvarVacina(uid: string, vacina: Partial<Vacina> & { id?: string }): Promise<string> {
  const id = vacina.id ?? doc(colecaoVacinas(uid)).id;
  const agora = new Date().toISOString();
  const dados = {
    ...vacina,
    id,
    criado_em: vacina.criado_em ?? agora,
  };
  await setDoc(docVacina(uid, id), dados, { merge: true });
  return id;
}

export async function excluirVacina(uid: string, id: string): Promise<void> {
  await deleteDoc(docVacina(uid, id));
}
