import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Card, Badge, Botao } from '../../componentes/ui';
import {
  User, Dog, Cat, FileText, Pill, Activity,
  Clock, ChevronLeft, Edit3, Plus
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const abas = ['Ficha', 'Medicamentos', 'Exames', 'Histórico', 'Documentos'] as const;
type Aba = typeof abas[number];

export function Perfil() {
  const { id } = useParams<{ id: string }>();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('Ficha');

  // Demo — in production this comes from Firestore
  const membro = {
    id: id ?? 'm1',
    nome: 'Ana Exemplo',
    tipo: 'pessoa' as 'pessoa' | 'cao' | 'gato' | 'outro',
    nascimento: '1985-03-15',
    tipo_sanguineo: 'A+',
    condicoes_ativas: ['Hipertensão'],
    alergias: ['Dipirona'],
  };

  const iconeMembro = { pessoa: User, cao: Dog, gato: Cat, outro: User };
  const Icone = iconeMembro[membro.tipo];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <NavLink to="/membros" className="mt-1 p-2 rounded-[var(--radius-md)] hover:bg-fundo-elevado transition-colors">
          <ChevronLeft size={20} className="text-texto-secundario" />
        </NavLink>
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-gradient-to-br from-salus-500 to-salus-700 flex items-center justify-center shadow-lg">
          <Icone size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-texto">{membro.nome}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variante="salus">{membro.tipo === 'pessoa' ? 'Pessoa' : membro.tipo}</Badge>
            {membro.tipo_sanguineo && <Badge variante="neutro">{membro.tipo_sanguineo}</Badge>}
          </div>
        </div>
        <Botao variante="secundario" tamanho="sm" icone={<Edit3 size={16} />}>
          Editar
        </Botao>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {abas.map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`
              px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] whitespace-nowrap
              transition-all touch-target
              ${abaAtiva === aba
                ? 'bg-salus-600/15 text-salus-400 border border-salus-600/30'
                : 'text-texto-secundario hover:text-texto hover:bg-fundo-elevado/50 border border-transparent'
              }
            `}
          >
            {aba}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {abaAtiva === 'Ficha' && (
        <Card>
          <h2 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <FileText size={18} className="text-salus-400" />
            Ficha de Saúde
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-texto-secundario mb-1">Nascimento</p>
              <p className="text-sm text-texto">{membro.nascimento}</p>
            </div>
            <div>
              <p className="text-xs text-texto-secundario mb-1">Tipo Sanguíneo</p>
              <p className="text-sm text-texto">{membro.tipo_sanguineo ?? 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs text-texto-secundario mb-1">Condições Ativas</p>
              <div className="flex flex-wrap gap-1">
                {membro.condicoes_ativas.length > 0
                  ? membro.condicoes_ativas.map((c) => <Badge key={c} variante="alerta">{c}</Badge>)
                  : <span className="text-sm text-texto-secundario">Nenhuma</span>
                }
              </div>
            </div>
            <div>
              <p className="text-xs text-texto-secundario mb-1">Alergias</p>
              <div className="flex flex-wrap gap-1">
                {membro.alergias.length > 0
                  ? membro.alergias.map((a) => <Badge key={a} variante="vencido">{a}</Badge>)
                  : <span className="text-sm text-texto-secundario">Nenhuma conhecida</span>
                }
              </div>
            </div>
          </div>
        </Card>
      )}

      {abaAtiva === 'Medicamentos' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-texto flex items-center gap-2">
              <Pill size={18} className="text-salus-400" />
              Medicamentos
            </h2>
            <Botao variante="secundario" tamanho="sm" icone={<Plus size={16} />}>Adicionar</Botao>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-texto">Losartana 50mg</span>
                <Badge variante="salus">Em uso</Badge>
              </div>
              <p className="text-xs text-texto-secundario">1x ao dia · Renovar em 60 dias</p>
            </div>
          </div>
        </Card>
      )}

      {abaAtiva === 'Exames' && (
        <Card>
          <h2 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <Activity size={18} className="text-salus-400" />
            Exames
          </h2>
          <p className="text-sm text-texto-secundario">Nenhum exame registrado ainda.</p>
        </Card>
      )}

      {abaAtiva === 'Histórico' && (
        <Card>
          <h2 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <Clock size={18} className="text-salus-400" />
            Histórico
          </h2>
          <p className="text-sm text-texto-secundario">Nenhum evento registrado ainda.</p>
        </Card>
      )}

      {abaAtiva === 'Documentos' && (
        <Card>
          <h2 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <FileText size={18} className="text-salus-400" />
            Documentos
          </h2>
          <p className="text-sm text-texto-secundario">
            Documentos originais ficam no seu Google Drive, na pasta "Salus App".
          </p>
        </Card>
      )}
    </div>
  );
}
