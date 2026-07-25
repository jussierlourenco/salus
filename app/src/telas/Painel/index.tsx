import { useState, useEffect } from 'react';
import { Card, Badge, Carregando } from '../../core/ui';
import {
  Activity,
  Pill,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Heart,
  Users,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthProvider';
import { listarMembros } from '../../modulos/membros/casos-de-uso/repositorioMembros';
import { listarMedicamentos } from '../../modulos/medicamentos/casos-de-uso/repositorioMedicamentos';
import { listarExames } from '../../modulos/exames/casos-de-uso/repositorioExames';
import { listarVacinas } from '../../modulos/vacinas/casos-de-uso/repositorioVacinas';
import { calcularAlertas } from '../../dominio/alertas';
import type { Membro } from '../../modulos/membros/entidades/membro';
import type { Medicamento } from '../../modulos/medicamentos/entidades/medicamento';
import type { Exame } from '../../modulos/exames/entidades/exame';
import type { Vacina } from '../../modulos/vacinas/entidades/vacina';
import type { Alerta } from '../../types/dominio';

const badgeVariante = {
  vencido: 'vencido' as const,
  vencendo_30d: 'alerta' as const,
  proximo_90d: 'neutro' as const,
};

const badgeTexto = {
  vencido: 'Vencido',
  vencendo_30d: 'Vence em 30d',
  proximo_90d: 'Próximos 90d',
};

export function Painel() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);

  const [membros, setMembros] = useState<Membro[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  useEffect(() => {
    async function carregarDados() {
      if (!usuario) return;
      setCarregando(true);
      try {
        const [mList, medList, exList, vacList] = await Promise.all([
          listarMembros(usuario.uid),
          listarMedicamentos(usuario.uid),
          listarExames(usuario.uid),
          listarVacinas(usuario.uid),
        ]);

        setMembros(mList);
        setMedicamentos(medList);
        setExames(exList);
        setVacinas(vacList);

        const alertasCalculados = calcularAlertas(mList, medList, vacList, []);
        setAlertas(alertasCalculados);
      } catch (err) {
        console.error('[Painel] Erro ao carregar dados do Firestore:', err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [usuario]);

  if (carregando) {
    return <Carregando texto="Carregando indicadores de saúde..." />;
  }

  const medsAtivosCount = medicamentos.filter((m) => m.status === 'em_uso' || m.status === 'prescrito').length;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
          <Activity size={24} className="text-salus-500" />
          Painel de Saúde
        </h1>
        <p className="text-texto-secundario mt-1 text-sm">
          Visão geral em tempo real conectada ao seu banco de dados Firestore.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Membros Cadastrados', valor: membros.length, icone: Users, cor: 'text-salus-400' },
          { label: 'Medicamentos Ativos', valor: medsAtivosCount, icone: Pill, cor: 'text-salus-400' },
          { label: 'Alertas Pendentes', valor: alertas.length, icone: AlertTriangle, cor: alertas.length > 0 ? 'text-alerta-400' : 'text-salus-400' },
          { label: 'Exames e Vacinas', valor: exames.length + vacinas.length, icone: TrendingUp, cor: 'text-salus-400' },
        ].map(({ label, valor, icone: Icone, cor }) => (
          <Card key={label} hover padding="sm">
            <div className="flex items-center gap-3">
              <div className={`shrink-0 ${cor}`}>
                <Icone size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-texto">{valor}</p>
                <p className="text-xs text-texto-secundario">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts / Agenda */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-salus-400" />
            <h2 className="font-semibold text-texto">Agenda e Alertas de Saúde</h2>
          </div>
          {alertas.length > 0 && (
            <Badge variante="alerta">{alertas.length} pendente(s)</Badge>
          )}
        </div>

        {alertas.length === 0 ? (
          <div className="p-6 text-center text-texto-secundario space-y-2 border border-borda/50 rounded-[var(--radius-md)] bg-fundo-elevado/20">
            <CheckCircle2 size={32} className="mx-auto text-salus-400/80 mb-1" />
            <p className="text-sm font-medium text-texto">Nenhum alerta pendente</p>
            <p className="text-xs">Todos os medicamentos e vacinas estão em dia no banco de dados.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className="flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] bg-fundo-elevado/40 border border-borda/60"
              >
                <div className="shrink-0 mt-0.5">
                  {alerta.tipo === 'vacina' ? (
                    <Heart size={18} className="text-salus-400" />
                  ) : alerta.tipo === 'medicamento' ? (
                    <Pill size={18} className="text-alerta-400" />
                  ) : (
                    <Clock size={18} className="text-texto-secundario" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-texto">{alerta.membro_nome}</span>
                    <Badge variante={badgeVariante[alerta.nivel]}>
                      {badgeTexto[alerta.nivel]}
                    </Badge>
                  </div>
                  <p className="text-sm text-texto-secundario">{alerta.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
