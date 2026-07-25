import { Card, Badge } from '../../componentes/ui';
import {
  Activity,
  Pill,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Heart,
  Users,
  Clock,
} from 'lucide-react';
import type { Alerta } from '../../types/dominio';

// Dados de demonstração
const alertasDemo: Alerta[] = [
  {
    id: '1',
    membro_id: 'm1',
    membro_nome: 'Ana Exemplo',
    nivel: 'vencido',
    tipo: 'vacina',
    descricao: 'Vacina Influenza — venceu há 15 dias',
    data: '2026-07-10',
  },
  {
    id: '2',
    membro_id: 'm2',
    membro_nome: 'Rex Exemplo',
    nivel: 'vencendo_30d',
    tipo: 'vacina',
    descricao: 'V8 Multipla — vence em 20 dias',
    data: '2026-08-14',
  },
  {
    id: '3',
    membro_id: 'm1',
    membro_nome: 'Ana Exemplo',
    nivel: 'proximo_90d',
    tipo: 'medicamento',
    descricao: 'Receita Losartana — renovar em 60 dias',
    data: '2026-09-25',
  },
];

const badgeVariante = {
  vencido: 'vencido' as const,
  vencendo_30d: 'alerta' as const,
  proximo_90d: 'neutro' as const,
};

const badgeTexto = {
  vencido: 'Vencido',
  vencendo_30d: 'Vence em 30 dias',
  proximo_90d: 'Próximos 90 dias',
};

export function Painel() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
          <Activity size={24} className="text-salus-500" />
          Painel de Saúde
        </h1>
        <p className="text-texto-secundario mt-1">
          Visão geral da família — o que precisa de atenção.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Membros', valor: '3', icone: Users, cor: 'text-salus-400' },
          { label: 'Medicamentos ativos', valor: '2', icone: Pill, cor: 'text-salus-400' },
          { label: 'Alertas', valor: '1', icone: AlertTriangle, cor: 'text-alerta-400' },
          { label: 'Exames recentes', valor: '5', icone: TrendingUp, cor: 'text-salus-400' },
        ].map(({ label, valor, icone: Icone, cor }) => (
          <Card key={label} hover padding="sm">
            <div className="flex items-center gap-3">
              <div className={`shrink-0 ${cor}`}>
                <Icone size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-texto">{valor}</p>
                <p className="text-xs text-texto-secundario">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-alerta-400" />
          <h2 className="font-semibold text-texto">Agenda de Saúde</h2>
        </div>
        <div className="space-y-3">
          {alertasDemo.map((alerta) => (
            <div
              key={alerta.id}
              className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50"
            >
              <div className="shrink-0 mt-0.5">
                {alerta.tipo === 'vacina' ? (
                  <Heart size={16} className="text-salus-400" />
                ) : alerta.tipo === 'medicamento' ? (
                  <Pill size={16} className="text-alerta-400" />
                ) : (
                  <Clock size={16} className="text-texto-secundario" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-texto">{alerta.membro_nome}</span>
                  <Badge variante={badgeVariante[alerta.nivel]}>
                    {badgeTexto[alerta.nivel]}
                  </Badge>
                </div>
                <p className="text-sm text-texto-secundario">{alerta.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card hover className="cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-salus-600/15 flex items-center justify-center group-hover:bg-salus-600/25 transition-colors">
              <Pill size={20} className="text-salus-400" />
            </div>
            <div>
              <p className="font-medium text-texto">Medicamentos Ativos</p>
              <p className="text-xs text-texto-secundario">Ver todos os medicamentos em uso</p>
            </div>
          </div>
        </Card>
        <Card hover className="cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-alerta-600/15 flex items-center justify-center group-hover:bg-alerta-600/25 transition-colors">
              <TrendingUp size={20} className="text-alerta-400" />
            </div>
            <div>
              <p className="font-medium text-texto">Últimos Exames</p>
              <p className="text-xs text-texto-secundario">Evolução dos marcadores</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
