import { collection, doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';
import { buscarUsuario, atualizarFamiliaIdUsuario } from './repositorioUsuarios';
import type { Familia, UsuarioSalus } from '../../types/dominio';

const COLECAO = 'familias';

// Coleções legadas que viviam sob usuarios/{uid}/* e precisam ser copiadas
// para familias/{familiaId}/* na primeira migração do usuário.
const COLECOES_LEGADAS = ['membros', 'medicamentos', 'exames', 'vacinas', 'eventos', 'caixa_entrada', 'config'];

function docFamilia(familiaId: string) {
  return doc(db, COLECAO, familiaId);
}

export async function buscarFamilia(familiaId: string): Promise<Familia | null> {
  const snap = await getDoc(docFamilia(familiaId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Familia;
}

export async function criarFamilia(uid: string, nome: string): Promise<Familia> {
  const ref = doc(collection(db, COLECAO));
  const agora = new Date().toISOString();
  const familia: Familia = {
    id: ref.id,
    nome,
    membros_uids: [uid],
    criado_por: uid,
    criado_em: agora,
    atualizado_em: agora,
  };
  await setDoc(ref, familia);
  return familia;
}

export async function entrarEmFamilia(familiaId: string, uid: string): Promise<Familia> {
  const familia = await buscarFamilia(familiaId);
  if (!familia) throw new Error('Código de convite inválido — família não encontrada.');
  if (!familia.membros_uids.includes(uid)) {
    await updateDoc(docFamilia(familiaId), {
      membros_uids: arrayUnion(uid),
      atualizado_em: new Date().toISOString(),
    });
    familia.membros_uids = [...familia.membros_uids, uid];
  }
  await atualizarFamiliaIdUsuario(uid, familiaId);
  return familia;
}

export async function sairDaFamilia(familiaId: string, uid: string): Promise<void> {
  await updateDoc(docFamilia(familiaId), {
    membros_uids: arrayRemove(uid),
    atualizado_em: new Date().toISOString(),
  });
}

/** Copia as coleções legadas de usuarios/{uid}/* para familias/{familiaId}/* (idempotente por doc id). */
async function migrarDadosLegados(uid: string, familiaId: string): Promise<void> {
  for (const nomeColecao of COLECOES_LEGADAS) {
    if (nomeColecao === 'config') {
      const origemSnap = await getDoc(doc(db, 'usuarios', uid, 'config', 'geral'));
      if (origemSnap.exists()) {
        await setDoc(doc(db, COLECAO, familiaId, 'config', 'geral'), origemSnap.data(), { merge: true });
      }
      continue;
    }

    const origemSnap = await getDocs(collection(db, 'usuarios', uid, nomeColecao));
    for (const d of origemSnap.docs) {
      await setDoc(doc(db, COLECAO, familiaId, nomeColecao, d.id), d.data(), { merge: true });
    }
  }
}

/**
 * Garante que o usuário pertence a uma família, criando uma nova (e migrando
 * dados legados de usuarios/{uid}/*) na primeira vez que ele loga.
 */
export async function garantirFamiliaDoUsuario(usuarioSalus: UsuarioSalus): Promise<string> {
  if (usuarioSalus.familia_id) {
    const existente = await buscarFamilia(usuarioSalus.familia_id);
    if (existente) return usuarioSalus.familia_id;
  }

  const nome = usuarioSalus.nome ? `Família de ${usuarioSalus.nome}` : 'Minha Família';
  const familia = await criarFamilia(usuarioSalus.uid, nome);
  await migrarDadosLegados(usuarioSalus.uid, familia.id);
  await atualizarFamiliaIdUsuario(usuarioSalus.uid, familia.id);
  return familia.id;
}

export interface MembroFamilia {
  uid: string;
  nome?: string;
  foto_url?: string;
}

export async function listarMembrosDaFamilia(familia: Familia): Promise<MembroFamilia[]> {
  const usuarios = await Promise.all(familia.membros_uids.map((uid) => buscarUsuario(uid)));
  return familia.membros_uids.map((uid, i) => {
    const u = usuarios[i];
    return { uid, nome: u?.nome, foto_url: u?.foto_url };
  });
}
