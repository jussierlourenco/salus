import type { ReactNode } from 'react';

/**
 * Destaca termos de pesquisa em um texto retornando nós React (<mark> e <span>).
 * Previne ataques XSS (CWE-79) garantindo que o React escape entidades HTML nativamente,
 * sem uso de dangerouslySetInnerHTML.
 */
export function destacarTermos(texto: string, termos: string[]): ReactNode {
  if (!texto) return null;
  if (termos.length === 0) return texto;
  const re = new RegExp(`(${termos.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = texto.split(re);
  return parts.map((part, i) =>
    termos.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-salus-600/30 text-salus-300 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
