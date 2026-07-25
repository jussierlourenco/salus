interface CarregandoProps {
  texto?: string;
  tamanho?: 'sm' | 'md' | 'lg';
}

const tamanhos = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Carregando({ texto, tamanho = 'md' }: CarregandoProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
      <svg
        className={`animate-spin text-salus-500 ${tamanhos[tamanho]}`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {texto && (
        <p className="text-sm text-texto-secundario">{texto}</p>
      )}
    </div>
  );
}
