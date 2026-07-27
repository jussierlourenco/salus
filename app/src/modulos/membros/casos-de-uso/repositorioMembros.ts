import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { Membro } from '../entidades/membro';

function colecaoMembros(familiaId: string) {
  return collection(db, 'familias', familiaId, 'membros');
}

function docMembro(familiaId: string, membroId: string) {
  return doc(db, 'familias', familiaId, 'membros', membroId);
}

export async function listarMembros(familiaId: string): Promise<Membro[]> {
  const q = query(colecaoMembros(familiaId), orderBy('nome'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Membro);
}

export async function buscarMembro(familiaId: string, membroId: string): Promise<Membro | null> {
  const snap = await getDoc(docMembro(familiaId, membroId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Membro;
}

export async function salvarMembro(familiaId: string, membro: Partial<Membro> & { id?: string }): Promise<string> {
  const id = membro.id ?? doc(colecaoMembros(familiaId)).id;
  const agora = new Date().toISOString();
  const dados = JSON.parse(JSON.stringify({
    ...membro,
    id,
    criado_em: membro.criado_em ?? agora,
    atualizado_em: agora,
  }));
  await setDoc(docMembro(familiaId, id), dados, { merge: true });
  return id;
}

export async function excluirMembro(familiaId: string, membroId: string): Promise<void> {
  await deleteDoc(docMembro(familiaId, membroId));
}
