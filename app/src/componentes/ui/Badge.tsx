import type { ReactNode } from 'react';

type VarianteBadge = 'padrao' | 'salus' | 'alerta' | 'vencido' | 'neutro';

interface BadgeProps {
  children: ReactNode;
  variante?: VarianteBadge;
  className?: string;
}

const estilos: Record<VarianteBadge, string> = {
  padrao: 'bg-fundo-elevado text-texto-secundario border-borda',
  salus: 'bg-salus-900/50 text-salus-300 border-salus-700/50',
  alerta: 'bg-alerta-600/20 text-alerta-400 border-alerta-600/30',
  vencido: 'bg-vencido-600/20 text-vencido-500 border-vencido-600/30',
  neutro: 'bg-fundo-elevado/50 text-texto-secundario border-transparent',
};

export function Badge({ children, variante = 'padrao', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5
        text-xs font-medium rounded-full border
        ${estilos[variante]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
