import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Botao, Card, Campo } from '../../core/ui';
import {
  Stethoscope, Users, ChevronRight, ChevronLeft,
  Shield, Cloud, Plus, X, Dog, Cat, User, Check,
} from 'lucide-react';

type Passo = 1 | 2 | 3 | 4 | 5;

interface MembroTemp {
  nome: string;
  tipo: 'pessoa' | 'cao' | 'gato' | 'outro';
}

export function Onboarding() {
  const [passo, setPasso] = useState<Passo>(1);
  const [membros, setMembros] = useState<MembroTemp[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState<MembroTemp['tipo']>('pessoa');
  const navigate = useNavigate();

  const adicionarMembro = () => {
    if (!novoNome.trim()) return;
    setMembros((prev) => [...prev, { nome: novoNome.trim(), tipo: novoTipo }]);
    setNovoNome('');
    setNovoTipo('pessoa');
  };

  const removerMembro = (index: number) => {
    setMembros((prev) => prev.filter((_, i) => i !== index));
  };

  const concluir = () => {
    // TODO: salvar membros no Firestore + marcar onboarding_concluido
    navigate('/', { replace: true });
  };

  const icones = { pessoa: User, cao: Dog, gato: Cat, outro: User };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((p) => (
            <div
              key={p}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                p <= passo ? 'bg-salus-500' : 'bg-fundo-elevado'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome + Consent */}
        {passo === 1 && (
          <Card glass padding="lg" className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-salus-500 to-salus-800 shadow-lg mb-4">
                <Stethoscope size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-texto">Bem-vindo ao Salus</h2>
              <p className="text-texto-secundario mt-2">
                Vamos montar a central de saúde da sua família.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                <Shield size={18} className="text-salus-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-texto">Seus dados, seu controle</p>
                  <p className="text-xs text-texto-secundario">
                    Nada é gravado sem sua confirmação. O Salus organiza informações — ele não diagnostica nem prescreve.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                <Users size={18} className="text-salus-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-texto">Consentimento de terceiros</p>
                  <p className="text-xs text-texto-secundario">
                    Ao registrar dados de outras pessoas, tenha o consentimento delas.
                  </p>
                </div>
              </div>
            </div>

            <Botao onClick={() => setPasso(2)} className="w-full" icone={<ChevronRight size={18} />}>
              Entendi e quero continuar
            </Botao>
          </Card>
        )}

        {/* Step 2: Drive */}
        {passo === 2 && (
          <Card glass padding="lg" className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-fundo-elevado mb-4">
                <Cloud size={32} className="text-alerta-400" />
              </div>
              <h2 className="text-xl font-bold text-texto">Guardar documentos na nuvem?</h2>
              <p className="text-texto-secundario mt-2 text-sm">
                Conecte seu Google Drive para guardar exames, receitas e laudos.
                Você pode pular e fazer isso depois.
              </p>
            </div>

            <div className="space-y-3">
              <Botao variante="secundario" className="w-full" icone={<Cloud size={18} />}>
                Conectar Google Drive
              </Botao>
              <Botao variante="fantasma" className="w-full" onClick={() => setPasso(3)}>
                Pular por agora
              </Botao>
            </div>
          </Card>
        )}

        {/* Step 3: Members */}
        {passo === 3 && (
          <Card glass padding="lg" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-texto">Quem faz parte da família?</h2>
              <p className="text-texto-secundario mt-1 text-sm">
                Adicione as pessoas e animais que você quer acompanhar.
              </p>
            </div>

            {/* Member list */}
            {membros.length > 0 && (
              <div className="space-y-2">
                {membros.map((m, i) => {
                  const Ic = icones[m.tipo];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                      <Ic size={18} className="text-salus-400" />
                      <span className="flex-1 text-sm font-medium text-texto">{m.nome}</span>
                      <span className="text-xs text-texto-secundario capitalize">{m.tipo}</span>
                      <button onClick={() => removerMembro(i)} className="p-1 hover:text-vencido-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add member */}
            <div className="space-y-3">
              <Campo
                label="Nome"
                value={novoNome}
                onChange={(e) => setNovoNome((e.target as HTMLInputElement).value)}
                placeholder="Ex: Maria, Rex, Luna..."
              />
              <div className="grid grid-cols-4 gap-2">
                {(['pessoa', 'cao', 'gato', 'outro'] as const).map((tipo) => {
                  const Ic = icones[tipo];
                  return (
                    <button
                      key={tipo}
                      onClick={() => setNovoTipo(tipo)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-[var(--radius-md)] border transition-all touch-target ${
                        novoTipo === tipo
                          ? 'border-salus-500 bg-salus-600/10 text-salus-400'
                          : 'border-borda text-texto-secundario hover:border-borda'
                      }`}
                    >
                      <Ic size={20} />
                      <span className="text-[10px] capitalize">{tipo === 'cao' ? 'Cão' : tipo}</span>
                    </button>
                  );
                })}
              </div>
              <Botao variante="secundario" className="w-full" onClick={adicionarMembro} icone={<Plus size={18} />}>
                Adicionar
              </Botao>
            </div>

            <div className="flex gap-2">
              <Botao variante="fantasma" onClick={() => setPasso(2)} icone={<ChevronLeft size={18} />}>
                Voltar
              </Botao>
              <Botao
                className="flex-1"
                onClick={() => setPasso(4)}
                disabled={membros.length === 0}
                icone={<ChevronRight size={18} />}
              >
                Continuar
              </Botao>
            </div>
          </Card>
        )}

        {/* Step 4: Relationships */}
        {passo === 4 && (
          <Card glass padding="lg" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-texto">Relações familiares</h2>
              <p className="text-texto-secundario mt-1 text-sm">
                Quem é pai/mãe, cônjuge, ou dono do pet?
                Isso ajuda no cruzamento de informações.
              </p>
            </div>

            <div className="space-y-3">
              {membros.map((m, i) => (
                <div key={i} className="p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50 space-y-2">
                  <p className="text-sm font-medium text-texto">{m.nome}</p>
                  <div className="space-y-1">
                    <label className="block text-xs text-texto-secundario">Papel na família</label>
                    <select
                      className="w-full bg-fundo-elevado/50 border border-borda rounded-[var(--radius-md)] px-3 py-2 text-sm text-texto focus:border-salus-500"
                      defaultValue="outro"
                    >
                      <option value="pai">Pai</option>
                      <option value="mae">Mãe</option>
                      <option value="filho">Filho(a)</option>
                      <option value="conjuge">Cônjuge</option>
                      <option value="dono">Dono(a)</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Botao variante="fantasma" onClick={() => setPasso(3)} icone={<ChevronLeft size={18} />}>
                Voltar
              </Botao>
              <Botao className="flex-1" onClick={() => setPasso(5)} icone={<ChevronRight size={18} />}>
                Continuar
              </Botao>
            </div>
          </Card>
        )}

        {/* Step 5: Summary */}
        {passo === 5 && (
          <Card glass padding="lg" className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-salus-500 to-salus-800 shadow-lg mb-4">
                <Check size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-texto">Tudo pronto!</h2>
              <p className="text-texto-secundario mt-2 text-sm">
                Sua central de saúde foi montada com {membros.length} {membros.length === 1 ? 'membro' : 'membros'}.
              </p>
            </div>

            <div className="space-y-2">
              {membros.map((m, i) => {
                const Ic = icones[m.tipo];
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                    <Ic size={18} className="text-salus-400" />
                    <span className="text-sm text-texto">{m.nome}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-texto-secundario text-center">
              Você pode adicionar documentos, exames e receitas a qualquer momento pela Caixa de Entrada.
            </p>

            <div className="flex gap-2">
              <Botao variante="fantasma" onClick={() => setPasso(4)} icone={<ChevronLeft size={18} />}>
                Voltar
              </Botao>
              <Botao className="flex-1" onClick={concluir} icone={<Check size={18} />}>
                Concluir
              </Botao>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
