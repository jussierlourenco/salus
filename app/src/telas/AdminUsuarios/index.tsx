import { useState, useEffect } from 'react';
import { Shield, Check, X, Users, RefreshCw, Mail, Clock, AlertTriangle } from 'lucide-react';
import { Card, Badge, Botao, Carregando } from '../../core/ui';
import { useAuth } from '../../core/auth/AuthProvider';
import { listarUsuarios, atualizarStatusUsuario } from '../../core/database/repositorioUsuarios';
import type { UsuarioSalus } from '../../types/dominio';

export function AdminUsuarios() {
  const { usuario, usuarioSalus } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioSalus[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [operando, setOperando] = useState<string | null>(null);

  const carregar = async () => {
    setCarregando(true);
    try {
      const lista = await listarUsuarios();
      setUsuarios(lista);
    } catch (err) {
      console.error('[AdminUsuarios] Erro ao listar:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleAprovar = async (uid: string) => {
    if (!usuario?.uid) return;
    setOperando(uid);
    try {
      await atualizarStatusUsuario(uid, 'approved', usuario.uid);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? { ...u, status: 'approved', aprovado_em: new Date().toISOString(), aprovado_por: usuario.uid }
            : u,
        ),
      );
    } catch (err) {
      console.error('[AdminUsuarios] Erro ao aprovar:', err);
    } finally {
      setOperando(null);
    }
  };

  const handleNegar = async (uid: string) => {
    if (!usuario?.uid) return;
    setOperando(uid);
    try {
      await atualizarStatusUsuario(uid, 'denied', usuario.uid);
      setUsuarios((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, status: 'denied' } : u)),
      );
    } catch (err) {
      console.error('[AdminUsuarios] Erro ao negar:', err);
    } finally {
      setOperando(null);
    }
  };

  const pendentes = usuarios.filter((u) => u.status === 'pending');
  const aprovados = usuarios.filter((u) => u.status === 'approved');
  const negados = usuarios.filter((u) => u.status === 'denied');

  if (!usuarioSalus?.admin) {
    return null;
  }

  if (carregando) {
    return <Carregando texto="Carregando usuários..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
            <Shield size={24} className="text-salus-500" />
            Gerenciar Usuários
          </h1>
          <p className="text-texto-secundario mt-1 text-sm">
            Aprove ou negue novos cadastros no Salus.
          </p>
        </div>
        <Botao tamanho="sm" icone={<RefreshCw size={16} />} onClick={carregar}>
          Atualizar
        </Botao>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-alerta-400" />
            <div>
              <p className="text-lg font-bold text-texto">{pendentes.length}</p>
              <p className="text-xs text-texto-secundario">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-salus-400" />
            <div>
              <p className="text-lg font-bold text-texto">{aprovados.length}</p>
              <p className="text-xs text-texto-secundario">Aprovados</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <X size={18} className="text-vencido-500" />
            <div>
              <p className="text-lg font-bold text-texto">{negados.length}</p>
              <p className="text-xs text-texto-secundario">Negados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <Card>
          <h2 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-alerta-400" />
            Pendentes
            <Badge variante="alerta">{pendentes.length}</Badge>
          </h2>
          <div className="space-y-3">
            {pendentes.map((u) => (
              <div
                key={u.uid}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-texto truncate">{u.nome ?? u.email}</p>
                  <p className="text-xs text-texto-secundario flex items-center gap-1">
                    <Mail size={11} />
                    {u.email}
                  </p>
                  <p className="text-[10px] text-texto-secundario mt-0.5">
                    {new Date(u.criado_em).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Botao
                    tamanho="sm"
                    variante="secundario"
                    icone={<Check size={16} />}
                    onClick={() => handleAprovar(u.uid)}
                    disabled={operando === u.uid}
                    className="border-salus-600/40 text-salus-400 hover:bg-salus-600/20"
                  >
                    Aprovar
                  </Botao>
                  <Botao
                    tamanho="sm"
                    variante="secundario"
                    icone={<X size={16} />}
                    onClick={() => handleNegar(u.uid)}
                    disabled={operando === u.uid}
                    className="border-vencido-600/40 text-vencido-500 hover:bg-vencido-500/20"
                  >
                    Negar
                  </Botao>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {pendentes.length === 0 && (
        <Card>
          <div className="flex flex-col items-center py-8 text-texto-secundario">
            <Check size={32} className="mb-2 text-salus-400" />
            <p className="text-sm font-medium text-texto">Nenhum cadastro pendente</p>
            <p className="text-xs mt-1">Todos os novos usuários já foram processados.</p>
          </div>
        </Card>
      )}

      {/* Todos os usuários */}
      <Card>
        <h2 className="font-semibold text-texto mb-4 flex items-center gap-2">
          <Users size={18} className="text-salus-400" />
          Todos os Usuários
          <Badge variante="neutro">{usuarios.length}</Badge>
        </h2>

        {usuarios.length === 0 ? (
          <p className="text-sm text-texto-secundario text-center py-6">Nenhum usuário encontrado.</p>
        ) : (
          <div className="space-y-2">
            {usuarios.map((u) => (
              <div
                key={u.uid}
                className="flex items-center gap-3 p-2.5 rounded-[var(--radius-md)] bg-fundo-elevado/20 border border-borda/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-texto truncate">{u.nome ?? u.email}</p>
                    {u.admin && <Badge variante="salus">Admin</Badge>}
                    <Badge
                      variante={
                        u.status === 'approved'
                          ? 'salus'
                          : u.status === 'pending'
                            ? 'alerta'
                            : 'neutro'
                      }
                    >
                      {u.status === 'approved'
                        ? 'Aprovado'
                        : u.status === 'pending'
                          ? 'Pendente'
                          : 'Negado'}
                    </Badge>
                  </div>
                  <p className="text-xs text-texto-secundario">{u.email}</p>
                </div>
                <span className="text-[10px] text-texto-secundario shrink-0">
                  {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
