import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, arrayUnion, arrayRemove, collectionGroup, where } from 'firebase/firestore';
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

export async function compartilharMembro(familiaId: string, membroId: string, uidAlvo: string): Promise<void> {
  await updateDoc(docMembro(familiaId, membroId), {
    compartilhado_com_uids: arrayUnion(uidAlvo),
  });
}

export async function removerCompartilhamento(familiaId: string, membroId: string, uidAlvo: string): Promise<void> {
  await updateDoc(docMembro(familiaId, membroId), {
    compartilhado_com_uids: arrayRemove(uidAlvo),
  });
}

export async function listarMembrosCompartilhados(uid: string): Promise<(Membro & { familia_origem_id: string })[]> {
  const q = query(collectionGroup(db, 'membros'), where('compartilhado_com_uids', 'array-contains', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    ...(d.data() as Membro),
    id: d.id,
    familia_origem_id: d.ref.path.split('/')[1],
  }));
}
