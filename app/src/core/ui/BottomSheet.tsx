import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  aberto: boolean;
  onFechar: () => void;
  titulo?: string;
  children: ReactNode;
}

/** Painel ancorado na base da tela (mobile-first), usado pelo FAB de input contextual da aba Diário. */
export function BottomSheet({ aberto, onFechar, titulo, children }: BottomSheetProps) {
  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div
        className="
          relative w-full max-w-lg max-h-[85dvh] flex flex-col
          bg-fundo-card border-t border-borda rounded-t-[var(--radius-lg)]
          shadow-2xl animate-slide-up safe-inset-bottom
        "
      >
        <div className="flex items-center justify-center pt-2.5 shrink-0">
          <div className="w-10 h-1 rounded-full bg-borda" />
        </div>
        {titulo && (
          <div className="flex items-center justify-between px-5 pt-2 pb-1 shrink-0">
            <h3 className="text-base font-bold text-texto">{titulo}</h3>
            <button
              onClick={onFechar}
              className="text-texto-secundario hover:text-texto p-1.5 -mr-1.5 rounded-[var(--radius-sm)] hover:bg-fundo-elevado transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
      </div>
    </div>,
    document.body
  );
}
