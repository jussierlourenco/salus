import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { CaixaEntradaItem } from '../entidades/caixaEntrada';

function colecaoCaixaEntrada(uid: string) {
  return collection(db, 'usuarios', uid, 'caixa_entrada');
}

function docCaixaEntrada(uid: string, id: string) {
  return doc(db, 'usuarios', uid, 'caixa_entrada', id);
}

export async function listarCaixaEntrada(uid: string): Promise<CaixaEntradaItem[]> {
  const snap = await getDocs(colecaoCaixaEntrada(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CaixaEntradaItem);
}

export async function salvarCaixaEntrada(uid: string, item: Partial<CaixaEntradaItem> & { id?: string }): Promise<string> {
  const id = item.id ?? doc(colecaoCaixaEntrada(uid)).id;
  const agora = new Date().toISOString();
  const dados = {
    ...item,
    id,
    criado_em: item.criado_em ?? agora,
    atualizado_em: agora,
  };
  await setDoc(docCaixaEntrada(uid, id), dados, { merge: true });
  return id;
}

export async function atualizarStatusCaixaEntrada(
  uid: string,
  itemId: string,
  status: CaixaEntradaItem['status']
): Promise<void> {
  await updateDoc(docCaixaEntrada(uid, itemId), {
    status,
    atualizado_em: new Date().toISOString(),
  });
}
