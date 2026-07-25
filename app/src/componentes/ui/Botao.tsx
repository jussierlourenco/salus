import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';
type Tamanho = 'sm' | 'md' | 'lg';

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  icone?: ReactNode;
  carregando?: boolean;
  children: ReactNode;
}

const estilosVariante: Record<Variante, string> = {
  primario: 'bg-salus-600 hover:bg-salus-700 text-white shadow-lg shadow-salus-600/20 active:scale-[0.97]',
  secundario: 'bg-fundo-elevado hover:bg-borda text-texto border border-borda active:scale-[0.97]',
  fantasma: 'bg-transparent hover:bg-fundo-elevado/50 text-texto-secundario hover:text-texto',
  perigo: 'bg-vencido-600 hover:bg-vencido-500 text-white active:scale-[0.97]',
};

const estilosTamanho: Record<Tamanho, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export function Botao({
  variante = 'primario',
  tamanho = 'md',
  icone,
  carregando = false,
  children,
  className = '',
  disabled,
  ...rest
}: BotaoProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        rounded-[var(--radius-md)] touch-target
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${estilosVariante[variante]}
        ${estilosTamanho[tamanho]}
        ${className}
      `}
      disabled={disabled || carregando}
      {...rest}
    >
      {carregando ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icone ? (
        <span className="shrink-0">{icone}</span>
      ) : null}
      {children}
    </button>
  );
}
