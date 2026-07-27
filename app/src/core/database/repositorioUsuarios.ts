import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { UsuarioSalus, StatusUsuarioSalus } from '../../types/dominio';

const COLECAO = 'admin_usuarios';

function docUsuario(uid: string) {
  return doc(db, COLECAO, uid);
}

export async function buscarUsuario(uid: string): Promise<UsuarioSalus | null> {
  const snap = await getDoc(docUsuario(uid));
  if (!snap.exists()) return null;
  return snap.data() as UsuarioSalus;
}

export async function criarUsuario(
  uid: string,
  email: string,
  nome: string,
  fotoUrl?: string,
): Promise<UsuarioSalus> {
  const usuario: UsuarioSalus = {
    uid,
    email,
    nome: nome || email.split('@')[0] || 'Usuário',
    foto_url: fotoUrl,
    status: 'pending',
    admin: false,
    criado_em: new Date().toISOString(),
  };

  // Auto-aprova o super-admin
  if (email === 'jussier.silva@gmail.com') {
    usuario.status = 'approved';
    usuario.admin = true;
    usuario.aprovado_em = usuario.criado_em;
    usuario.aprovado_por = 'auto';
  }

  await setDoc(docUsuario(uid), usuario);
  return usuario;
}

export async function atualizarStatusUsuario(
  uid: string,
  status: StatusUsuarioSalus,
  aprovadoPor: string,
): Promise<void> {
  const dados: Record<string, unknown> = { status };
  if (status === 'approved') {
    dados.aprovado_em = new Date().toISOString();
    dados.aprovado_por = aprovadoPor;
  }
  await updateDoc(docUsuario(uid), dados);
}

export async function atualizarFamiliaIdUsuario(uid: string, familiaId: string): Promise<void> {
  await updateDoc(docUsuario(uid), { familia_id: familiaId });
}

export async function listarUsuarios(): Promise<UsuarioSalus[]> {
  const q = query(collection(db, COLECAO), orderBy('criado_em', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UsuarioSalus);
}
