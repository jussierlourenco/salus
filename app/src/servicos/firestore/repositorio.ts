/**
 * Repositórios Firestore escopados por UID.
 * Todos os dados do usuário ficam na coleção `usuarios/{uid}/...`
 * garantindo isolamento total por regras de segurança.
 */

import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../../data/firebase';
import type { Membro, Medicamento, Exame, Vacina, Evento, CaixaEntradaItem } from '../../types/dominio';

// ── Helpers de coleção ──

function colecaoUsuario(uid: string, nomeColecao: string) {
  return collection(db, 'usuarios', uid, nomeColecao);
}

function docUsuario(uid: string, nomeColecao: string, docId: string) {
  return doc(db, 'usuarios', uid, nomeColecao, docId);
}

// ── Membros ──

export async function listarMembros(uid: string): Promise<Membro[]> {
  const q = query(colecaoUsuario(uid, 'membros'), orderBy('nome'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Membro);
}

export async function buscarMembro(uid: string, membroId: string): Promise<Membro | null> {
  const snap = await getDoc(docUsuario(uid, 'membros', membroId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Membro;
}

export async function salvarMembro(uid: string, membro: Partial<Membro> & { id?: string }): Promise<string> {
  const id = membro.id ?? doc(colecaoUsuario(uid, 'membros')).id;
  const agora = new Date().toISOString();
  const dados = {
    ...membro,
    id,
    criado_em: membro.criado_em ?? agora,
    atualizado_em: agora,
  };
  await setDoc(docUsuario(uid, 'membros', id), dados, { merge: true });
  return id;
}

export async function excluirMembro(uid: string, membroId: string): Promise<void> {
  await deleteDoc(docUsuario(uid, 'membros', membroId));
}

// ── Medicamentos ──

export async function listarMedicamentos(uid: string, membroId?: string): Promise<Medicamento[]> {
  const snap = await getDocs(colecaoUsuario(uid, 'medicamentos'));
  const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Medicamento);
  if (membroId) return todos.filter((m) => m.membro_id === membroId);
  return todos;
}

export async function salvarMedicamento(uid: string, med: Partial<Medicamento> & { id?: string }): Promise<string> {
  const id = med.id ?? doc(colecaoUsuario(uid, 'medicamentos')).id;
  const agora = new Date().toISOString();
  const dados = {
    ...med,
    id,
    criado_em: med.criado_em ?? agora,
    atualizado_em: agora,
  };
  await setDoc(docUsuario(uid, 'medicamentos', id), dados, { merge: true });
  return id;
}

// ── Exames ──

export async function listarExames(uid: string, membroId?: string): Promise<Exame[]> {
  const snap = await getDocs(colecaoUsuario(uid, 'exames'));
  const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Exame);
  if (membroId) return todos.filter((e) => e.membro_id === membroId);
  return todos;
}

export async function salvarExame(uid: string, exame: Partial<Exame> & { id?: string }): Promise<string> {
  const id = exame.id ?? doc(colecaoUsuario(uid, 'exames')).id;
  const agora = new Date().toISOString();
  const dados = {
    ...exame,
    id,
    criado_em: exame.criado_em ?? agora,
  };
  await setDoc(docUsuario(uid, 'exames', id), dados, { merge: true });
  return id;
}

// ── Vacinas ──

export async function listarVacinas(uid: string, membroId?: string): Promise<Vacina[]> {
  const snap = await getDocs(colecaoUsuario(uid, 'vacinas'));
  const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Vacina);
  if (membroId) return todos.filter((v) => v.membro_id === membroId);
  return todos;
}

export async function salvarVacina(uid: string, vacina: Partial<Vacina> & { id?: string }): Promise<string> {
  const id = vacina.id ?? doc(colecaoUsuario(uid, 'vacinas')).id;
  const agora = new Date().toISOString();
  const dados = {
    ...vacina,
    id,
    criado_em: vacina.criado_em ?? agora,
  };
  await setDoc(docUsuario(uid, 'vacinas', id), dados, { merge: true });
  return id;
}

// ── Eventos / Histórico ──

export async function listarEventos(uid: string, membroId?: string): Promise<Evento[]> {
  const snap = await getDocs(colecaoUsuario(uid, 'eventos'));
  const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento);
  if (membroId) return todos.filter((e) => e.membro_id === membroId);
  return todos;
}

export async function salvarEvento(uid: string, evento: Partial<Evento> & { id?: string }): Promise<string> {
  const id = evento.id ?? doc(colecaoUsuario(uid, 'eventos')).id;
  const agora = new Date().toISOString();
  const dados = {
    ...evento,
    id,
    criado_em: evento.criado_em ?? agora,
  };
  await setDoc(docUsuario(uid, 'eventos', id), dados, { merge: true });
  return id;
}

// ── Caixa de Entrada ──

export async function listarCaixaEntrada(uid: string): Promise<CaixaEntradaItem[]> {
  const snap = await getDocs(colecaoUsuario(uid, 'caixa_entrada'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CaixaEntradaItem);
}

export async function salvarCaixaEntrada(uid: string, item: Partial<CaixaEntradaItem> & { id?: string }): Promise<string> {
  const id = item.id ?? doc(colecaoUsuario(uid, 'caixa_entrada')).id;
  const agora = new Date().toISOString();
  const dados = {
    ...item,
    id,
    criado_em: item.criado_em ?? agora,
    atualizado_em: agora,
  };
  await setDoc(docUsuario(uid, 'caixa_entrada', id), dados, { merge: true });
  return id;
}

export async function atualizarStatusCaixaEntrada(
  uid: string,
  itemId: string,
  status: CaixaEntradaItem['status']
): Promise<void> {
  await updateDoc(docUsuario(uid, 'caixa_entrada', itemId), {
    status,
    atualizado_em: new Date().toISOString(),
  });
}
