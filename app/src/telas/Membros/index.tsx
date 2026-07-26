import { useState, useEffect } from 'react';
import { Card, Badge, Botao, EstadoVazio, Carregando, Campo } from '../../core/ui';
import { Users, Plus, Dog, Cat, User, ChevronRight, RefreshCw, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import { listarMembros, salvarMembro } from '../../modulos/membros/casos-de-uso/repositorioMembros';
import type { Membro, TipoMembro, Vinculo } from '../../modulos/membros/entidades/membro';

const iconesTipo = {
  pessoa: User,
  cao: Dog,
  gato: Cat,
  outro: User,
};

const coresTipo = {
  pessoa: 'from-salus-500 to-salus-700',
  cao: 'from-amber-500 to-amber-700',
  gato: 'from-purple-500 to-purple-700',
  outro: 'from-slate-500 to-slate-700',
};

export function Membros() {
  const { usuario } = useAuth();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal de adição
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoMembro>('pessoa');
  const [nascimento, setNascimento] = useState('');
  const [vinculo, setVinculo] = useState<Vinculo>('biologico');
  const [tipoSanguineo, setTipoSanguineo] = useState('');
  const [raca, setRaca] = useState('');
  const [condicoesText, setCondicoesText] = useState('');
  const [alergiasText, setAlergiasText] = useState('');

  const carregar = async () => {
    if (!usuario) return;
    setCarregando(true);
    try {
      const lista = await listarMembros(usuario.uid);
      setMembros(lista);
    } catch (err) {
      console.error('[Membros] Erro ao carregar do Firestore:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [usuario]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !nome.trim()) return;

    setSalvando(true);
    try {
      const condicoes_ativas = condicoesText.split(',').map((s) => s.trim()).filter(Boolean);
      const alergias = alergiasText.split(',').map((s) => s.trim()).filter(Boolean);

      await salvarMembro(usuario.uid, {
        nome: nome.trim(),
        tipo,
        nascimento: nascimento || undefined,
        vinculo,
        tipo_sanguineo: tipoSanguineo.trim() || undefined,
        raca: raca.trim() || undefined,
        condicoes_ativas,
        alergias,
        relacoes: [],
      });

      // Limpar formulário e recarregar
      setNome('');
      setNascimento('');
      setRaca('');
      setCondicoesText('');
      setAlergiasText('');
      setModalAberto(false);
      await carregar();
    } catch (err) {
      alert('Erro ao salvar membro: ' + (err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return <Carregando texto="Carregando membros da família..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
            <Users size={24} className="text-salus-500" />
            Membros da Família
          </h1>
          <p className="text-texto-secundario mt-1">
            Pessoas e animais cadastrados no Salus.
          </p>
        </div>
        <Botao icone={<Plus size={18} />} tamanho="sm" onClick={() => setModalAberto(true)}>
          Adicionar Membro
        </Botao>
      </div>

      {membros.length === 0 ? (
        <EstadoVazio
          icone={<Users size={48} />}
          titulo="Nenhum membro cadastrado ainda"
          descricao="Cadastre as pessoas e animais da sua família no banco de dados."
          acao={
            <Botao icone={<Plus size={18} />} onClick={() => setModalAberto(true)}>
              Cadastrar Primeiro Membro
            </Botao>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {membros.map((membro) => {
            const Icone = iconesTipo[membro.tipo] ?? User;
            const cor = coresTipo[membro.tipo] ?? coresTipo.outro;
            return (
              <NavLink key={membro.id} to={`/membro/${membro.id}`}>
                <Card hover className="group h-full">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-[var(--radius-lg)] bg-gradient-to-br ${cor} flex items-center justify-center shadow-lg shrink-0`}>
                      <Icone size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-texto truncate">{membro.nome}</h3>
                        <ChevronRight size={16} className="text-texto-secundario/50 group-hover:text-salus-400 transition-colors shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variante="neutro">
                          {membro.tipo === 'pessoa' ? 'Pessoa' : membro.tipo === 'cao' ? 'Cão' : membro.tipo === 'gato' ? 'Gato' : 'Outro'}
                        </Badge>
                        {membro.raca && (
                          <span className="text-xs text-texto-secundario truncate">{membro.raca}</span>
                        )}
                      </div>
                      {membro.condicoes_ativas && membro.condicoes_ativas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {membro.condicoes_ativas.map((c) => (
                            <Badge key={c} variante="alerta">{c}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </NavLink>
            );
          })}
        </div>
      )}

      {/* Bottom Sheet — Cadastrar Membro */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalAberto(false)} />
          <div className="relative bg-fundo-card border-t border-borda rounded-t-[var(--radius-xl)] p-6 max-h-[85dvh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-texto flex items-center gap-2">
                <Users size={20} className="text-salus-500" />
                Cadastrar Membro
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-texto-secundario hover:text-texto p-2 -mr-2">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-3">
              <Campo
                label="Nome completo *"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="ex: Maria Silva, Rex"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-texto-secundario mb-1">Tipo *</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoMembro)}
                    className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm focus:outline-none focus:border-salus-500"
                  >
                    <option value="pessoa">Pessoa</option>
                    <option value="cao">Cão</option>
                    <option value="gato">Gato</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-texto-secundario mb-1">Vínculo</label>
                  <select
                    value={vinculo}
                    onChange={(e) => setVinculo(e.target.value as Vinculo)}
                    className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm focus:outline-none focus:border-salus-500"
                  >
                    <option value="biologico">Biológico</option>
                    <option value="adotivo">Adotivo</option>
                    <option value="enteado">Enteado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Campo
                  label="Data de Nascimento"
                  type="date"
                  value={nascimento}
                  onChange={(e) => setNascimento(e.target.value)}
                />

                {tipo === 'pessoa' ? (
                  <Campo
                    label="Tipo Sanguíneo"
                    value={tipoSanguineo}
                    onChange={(e) => setTipoSanguineo(e.target.value)}
                    placeholder="ex: O+, A-"
                  />
                ) : (
                  <Campo
                    label="Raça (para pets)"
                    value={raca}
                    onChange={(e) => setRaca(e.target.value)}
                    placeholder="ex: Golden Retriever"
                  />
                )}
              </div>

              <Campo
                label="Condições / Doenças ativas (separadas por vírgula)"
                value={condicoesText}
                onChange={(e) => setCondicoesText(e.target.value)}
                placeholder="ex: Hipertensão, Diabetes"
              />

              <Campo
                label="Alergias (separadas por vírgula)"
                value={alergiasText}
                onChange={(e) => setAlergiasText(e.target.value)}
                placeholder="ex: Dipirona, Penicilina"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-borda">
                <Botao variante="secundario" tamanho="sm" type="button" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Botao>
                <Botao
                  tamanho="sm"
                  type="submit"
                  disabled={salvando || !nome.trim()}
                  icone={salvando ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Botao>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
