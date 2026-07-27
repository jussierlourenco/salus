import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { Exame } from '../entidades/exame';

function colecaoExames(familiaId: string) {
  return collection(db, 'familias', familiaId, 'exames');
}

function docExame(familiaId: string, id: string) {
  return doc(db, 'familias', familiaId, 'exames', id);
}

export async function listarExames(familiaId: string, membroId?: string): Promise<Exame[]> {
  if (membroId) {
    const q = query(colecaoExames(familiaId), where('membro_id', '==', membroId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Exame);
  }
  const snap = await getDocs(colecaoExames(familiaId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Exame);
}

export async function salvarExame(familiaId: string, exame: Partial<Exame> & { id?: string }): Promise<string> {
  const id = exame.id ?? doc(colecaoExames(familiaId)).id;
  const agora = new Date().toISOString();
  const dados = JSON.parse(JSON.stringify({
    ...exame,
    id,
    criado_em: exame.criado_em ?? agora,
    atualizado_em: agora,
  }));
  await setDoc(docExame(familiaId, id), dados, { merge: true });
  return id;
}

export async function excluirExame(familiaId: string, id: string): Promise<void> {
  await deleteDoc(docExame(familiaId, id));
}
