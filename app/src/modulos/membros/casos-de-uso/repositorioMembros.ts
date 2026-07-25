import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { Membro } from '../entidades/membro';

function colecaoMembros(uid: string) {
  return collection(db, 'usuarios', uid, 'membros');
}

function docMembro(uid: string, membroId: string) {
  return doc(db, 'usuarios', uid, 'membros', membroId);
}

export async function listarMembros(uid: string): Promise<Membro[]> {
  const q = query(colecaoMembros(uid), orderBy('nome'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Membro);
}

export async function buscarMembro(uid: string, membroId: string): Promise<Membro | null> {
  const snap = await getDoc(docMembro(uid, membroId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Membro;
}

export async function salvarMembro(uid: string, membro: Partial<Membro> & { id?: string }): Promise<string> {
  const id = membro.id ?? doc(colecaoMembros(uid)).id;
  const agora = new Date().toISOString();
  const dados = {
    ...membro,
    id,
    criado_em: membro.criado_em ?? agora,
    atualizado_em: agora,
  };
  await setDoc(docMembro(uid, id), dados, { merge: true });
  return id;
}

export async function excluirMembro(uid: string, membroId: string): Promise<void> {
  await deleteDoc(docMembro(uid, membroId));
}
