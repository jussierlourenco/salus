import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../core/database/firebase';
import type { CaixaEntradaItem } from '../entidades/caixaEntrada';

function colecaoCaixaEntrada(familiaId: string) {
  return collection(db, 'familias', familiaId, 'caixa_entrada');
}

function docCaixaEntrada(familiaId: string, id: string) {
  return doc(db, 'familias', familiaId, 'caixa_entrada', id);
}

export async function listarCaixaEntrada(familiaId: string): Promise<CaixaEntradaItem[]> {
  const snap = await getDocs(colecaoCaixaEntrada(familiaId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CaixaEntradaItem);
}

export async function salvarCaixaEntrada(familiaId: string, item: Partial<CaixaEntradaItem> & { id?: string }): Promise<string> {
  const id = item.id ?? doc(colecaoCaixaEntrada(familiaId)).id;
  const agora = new Date().toISOString();
  const dados = JSON.parse(JSON.stringify({
    ...item,
    id,
    criado_em: item.criado_em ?? agora,
    atualizado_em: agora,
  }));
  await setDoc(docCaixaEntrada(familiaId, id), dados, { merge: true });
  return id;
}

export async function atualizarStatusCaixaEntrada(
  familiaId: string,
  itemId: string,
  status: CaixaEntradaItem['status']
): Promise<void> {
  await updateDoc(docCaixaEntrada(familiaId, itemId), {
    status,
    atualizado_em: new Date().toISOString(),
  });
}

export async function atualizarCaixaEntrada(
  familiaId: string,
  itemId: string,
  dados: Partial<Omit<CaixaEntradaItem, 'id' | 'criado_em'>>
): Promise<void> {
  await updateDoc(docCaixaEntrada(familiaId, itemId), {
    ...dados,
    atualizado_em: new Date().toISOString(),
  } as Record<string, unknown>);
}
