import { useEffect, useState } from 'react';

export type Tema = 'escuro' | 'claro';

const STORAGE_KEY = 'salus_tema';

function lerTemaSalvo(): Tema {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo === 'claro' || salvo === 'escuro') return salvo;
  } catch {
    // localStorage indisponível — segue com o padrão
  }
  return 'escuro';
}

function aplicarTema(tema: Tema) {
  document.documentElement.dataset.theme = tema;
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(() => {
    const inicial = lerTemaSalvo();
    aplicarTema(inicial);
    return inicial;
  });

  useEffect(() => {
    aplicarTema(tema);
    try {
      localStorage.setItem(STORAGE_KEY, tema);
    } catch {
      // localStorage indisponível — a preferência só vale para esta sessão
    }
  }, [tema]);

  const alternarTema = () => setTema((atual) => (atual === 'escuro' ? 'claro' : 'escuro'));

  return { tema, alternarTema };
}
