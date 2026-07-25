import type { ReactNode } from 'react';

interface EstadoVazioProps {
  icone: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

export function EstadoVazio({ icone, titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="text-texto-secundario/40 mb-4">{icone}</div>
      <h3 className="text-lg font-semibold text-texto mb-1">{titulo}</h3>
      {descricao && (
        <p className="text-sm text-texto-secundario max-w-sm mb-6">{descricao}</p>
      )}
      {acao && <div>{acao}</div>}
    </div>
  );
}
