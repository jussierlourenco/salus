import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TOTAL_DE_PAGINAS = 15;

export function Tutorial() {
  return (
    <article className="max-w-5xl mx-auto animate-fade-in">
      <header className="sticky top-0 z-20 -mx-4 -mt-6 mb-5 px-4 py-3 bg-fundo/95 backdrop-blur border-b border-borda">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Voltar ao painel"
            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-texto-secundario
                       hover:text-texto hover:bg-fundo-elevado transition-colors touch-target"
          >
            <ArrowLeft size={21} />
          </Link>
          <div>
            <h1 className="font-bold text-texto">Como funciona o Salus</h1>
            <p className="text-xs text-texto-secundario">Tutorial completo · 15 páginas</p>
          </div>
        </div>
      </header>

      <div className="space-y-4" aria-label="Páginas do tutorial">
        {Array.from({ length: TOTAL_DE_PAGINAS }, (_, indice) => {
          const pagina = indice + 1;
          const numero = String(pagina).padStart(2, '0');

          return (
            <figure
              key={pagina}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-borda bg-fundo-card shadow-sm"
            >
              <img
                src={`/tutorial/pagina-${numero}.jpg`}
                alt={`Tutorial do Salus — página ${pagina} de ${TOTAL_DE_PAGINAS}`}
                width={1376}
                height={744}
                loading={pagina <= 2 ? 'eager' : 'lazy'}
                decoding="async"
                className="block w-full h-auto"
              />
              <figcaption className="sr-only">
                Página {pagina} de {TOTAL_DE_PAGINAS}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </article>
  );
}
