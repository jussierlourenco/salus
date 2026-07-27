import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../database/firebase';
import { buscarUsuario, criarUsuario } from '../database/repositorioUsuarios';
import { garantirFamiliaDoUsuario } from '../database/repositorioFamilias';
import type { UsuarioSalus } from '../../types/dominio';

interface AuthContexto {
  usuario: User | null;
  usuarioSalus: UsuarioSalus | null;
  familiaId: string | null;
  carregando: boolean;
  carregandoUsuarioSalus: boolean;
  entrar: () => Promise<void>;
  sair: () => Promise<void>;
  recarregarUsuarioSalus: () => Promise<void>;
}

const AuthContext = createContext<AuthContexto>({
  usuario: null,
  usuarioSalus: null,
  familiaId: null,
  carregando: true,
  carregandoUsuarioSalus: true,
  entrar: async () => {},
  sair: async () => {},
  recarregarUsuarioSalus: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [usuarioSalus, setUsuarioSalus] = useState<UsuarioSalus | null>(null);
  const [familiaId, setFamiliaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoUsuarioSalus, setCarregandoUsuarioSalus] = useState(true);

  const carregarOuCriarUsuario = async (user: User) => {
    setCarregandoUsuarioSalus(true);
    try {
      const uid = user.uid;
      const email = user.email ?? '';
      const nome = user.displayName ?? email.split('@')[0] ?? 'Usuário';
      const fotoUrl = user.photoURL ?? undefined;

      let salus = await buscarUsuario(uid);

      // Novo usuário — cria pendente (ou aprovado se for admin)
      if (!salus) {
        salus = await criarUsuario(uid, email, nome, fotoUrl);
      }

      // Garante que o usuário pertence a uma família (cria uma nova + migra dados legados na 1ª vez)
      const idFamilia = await garantirFamiliaDoUsuario(salus);
      if (idFamilia !== salus.familia_id) {
        salus = { ...salus, familia_id: idFamilia };
      }

      setUsuarioSalus(salus);
      setFamiliaId(idFamilia);
      setCarregandoUsuarioSalus(false);
    } catch (err) {
      console.error('[AuthProvider] Erro ao carregar/criar UsuarioSalus:', err);
      setCarregandoUsuarioSalus(false);
    }
  };

  // Carrega/cria o UsuarioSalus sempre que o Firebase Auth mudar
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);

      if (user) {
        carregarOuCriarUsuario(user);
      } else {
        setUsuarioSalus(null);
        setFamiliaId(null);
        setCarregandoUsuarioSalus(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const recarregarUsuarioSalus = async () => {
    if (usuario) {
      await carregarOuCriarUsuario(usuario);
    }
  };

  const entrar = async () => {
    setCarregando(true);
    setCarregandoUsuarioSalus(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setCarregando(false);
      setCarregandoUsuarioSalus(false);
    }
  };

  const sair = async () => {
    await signOut(auth);
    setUsuarioSalus(null);
    setFamiliaId(null);
  };

  return (
    <AuthContext.Provider
      value={{ usuario, usuarioSalus, familiaId, carregando, carregandoUsuarioSalus, entrar, sair, recarregarUsuarioSalus }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
