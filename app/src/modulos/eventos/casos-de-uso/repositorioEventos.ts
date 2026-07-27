import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { Evento } from '../entidades/evento';

function colecaoEventos(familiaId: string) {
  return collection(db, 'familias', familiaId, 'eventos');
}

function docEvento(familiaId: string, id: string) {
  return doc(db, 'familias', familiaId, 'eventos', id);
}

export async function listarEventos(familiaId: string, membroId?: string): Promise<Evento[]> {
  if (membroId) {
    const q = query(colecaoEventos(familiaId), where('membro_id', '==', membroId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento);
  }
  const snap = await getDocs(colecaoEventos(familiaId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento);
}

export async function salvarEvento(familiaId: string, evento: Partial<Evento> & { id?: string }): Promise<string> {
  const id = evento.id ?? doc(colecaoEventos(familiaId)).id;
  const agora = new Date().toISOString();
  const dados = JSON.parse(JSON.stringify({
    ...evento,
    id,
    criado_em: evento.criado_em ?? agora,
    atualizado_em: agora,
  }));
  await setDoc(docEvento(familiaId, id), dados, { merge: true });
  return id;
}

export async function excluirEvento(familiaId: string, id: string): Promise<void> {
  await deleteDoc(docEvento(familiaId, id));
}
