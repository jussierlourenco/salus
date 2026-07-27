import type { ReactNode } from 'react';
import { Card } from './Card';

interface TimelineProps {
  children: ReactNode;
  className?: string;
}

/** Linha do tempo vertical — desenha uma única guia contínua atrás dos marcadores de cada TimelineEvent filho. */
export function Timeline({ children, className = '' }: TimelineProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-4 top-2 bottom-2 w-px bg-borda" aria-hidden="true" />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface TimelineEventProps {
  hora: string;
  icone: ReactNode;
  titulo: string;
  valor?: string;
  descricao?: string;
  corIcone?: string;
  onClick?: () => void;
}

export function TimelineEvent({
  hora,
  icone,
  titulo,
  valor,
  descricao,
  corIcone,
  onClick,
}: TimelineEventProps) {
  return (
    <div className="relative flex gap-3">
      <div
        className={`
          relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border
          ${corIcone ?? 'bg-salus-900/50 border-salus-700/50 text-salus-300'}
        `}
      >
        {icone}
      </div>
      <Card
        padding="sm"
        hover={!!onClick}
        onClick={onClick}
        className={`flex-1 min-w-0 ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-texto-secundario">{hora}</span>
          {valor && <span className="text-sm font-bold text-salus-400 truncate max-w-[55%] text-right">{valor}</span>}
        </div>
        <p className="text-sm font-semibold text-texto mt-0.5 truncate">{titulo}</p>
        {descricao && <p className="text-xs text-texto-secundario mt-1">{descricao}</p>}
      </Card>
    </div>
  );
}
