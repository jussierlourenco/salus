import { Card, Badge, Botao, EstadoVazio } from '../../componentes/ui';
import { Users, Plus, Dog, Cat, User, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { Membro } from '../../types/dominio';

// Demo data
const membrosDemo: Membro[] = [
  {
    id: 'm1', nome: 'Ana Exemplo', tipo: 'pessoa', nascimento: '1985-03-15',
    vinculo: 'biologico', condicoes_ativas: ['Hipertensão'], alergias: ['Dipirona'],
    tipo_sanguineo: 'A+', relacoes: [], criado_em: '2026-01-01', atualizado_em: '2026-07-20',
  },
  {
    id: 'm2', nome: 'Rex Exemplo', tipo: 'cao', nascimento: '2020-06-10',
    vinculo: 'biologico', condicoes_ativas: [], alergias: [],
    raca: 'Golden Retriever', peso_kg: 32, relacoes: [], criado_em: '2026-01-01', atualizado_em: '2026-07-20',
  },
  {
    id: 'm3', nome: 'Luna Exemplo', tipo: 'gato', nascimento: '2022-11-05',
    vinculo: 'biologico', condicoes_ativas: [], alergias: [],
    raca: 'Siamês', peso_kg: 4.5, relacoes: [], criado_em: '2026-01-01', atualizado_em: '2026-07-20',
  },
];

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
  const membros = membrosDemo; // TODO: replace with Firestore

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
            <Users size={24} className="text-salus-500" />
            Membros da Família
          </h1>
          <p className="text-texto-secundario mt-1">
            Pessoas e animais da sua central de saúde.
          </p>
        </div>
        <Botao icone={<Plus size={18} />} tamanho="sm">
          Adicionar
        </Botao>
      </div>

      {membros.length === 0 ? (
        <EstadoVazio
          icone={<Users size={48} />}
          titulo="Nenhum membro ainda"
          descricao="Adicione as pessoas e animais da sua família para começar."
          acao={<Botao icone={<Plus size={18} />}>Adicionar primeiro membro</Botao>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {membros.map((membro) => {
            const Icone = iconesTipo[membro.tipo];
            const cor = coresTipo[membro.tipo];
            return (
              <NavLink key={membro.id} to={`/membro/${membro.id}`}>
                <Card hover className="group">
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
                          <span className="text-xs text-texto-secundario">{membro.raca}</span>
                        )}
                      </div>
                      {membro.condicoes_ativas.length > 0 && (
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
    </div>
  );
}
