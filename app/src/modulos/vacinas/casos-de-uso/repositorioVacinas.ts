import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { Vacina } from '../entidades/vacina';

function colecaoVacinas(familiaId: string) {
  return collection(db, 'familias', familiaId, 'vacinas');
}

function docVacina(familiaId: string, id: string) {
  return doc(db, 'familias', familiaId, 'vacinas', id);
}

export async function listarVacinas(familiaId: string, membroId?: string): Promise<Vacina[]> {
  if (membroId) {
    const q = query(colecaoVacinas(familiaId), where('membro_id', '==', membroId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Vacina);
  }
  const snap = await getDocs(colecaoVacinas(familiaId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Vacina);
}

export async function salvarVacina(familiaId: string, vacina: Partial<Vacina> & { id?: string }): Promise<string> {
  const id = vacina.id ?? doc(colecaoVacinas(familiaId)).id;
  const agora = new Date().toISOString();
  const dados = JSON.parse(JSON.stringify({
    ...vacina,
    id,
    criado_em: vacina.criado_em ?? agora,
  }));
  await setDoc(docVacina(familiaId, id), dados, { merge: true });
  return id;
}

export async function excluirVacina(familiaId: string, id: string): Promise<void> {
  await deleteDoc(docVacina(familiaId, id));
}
