import { useEffect, useState } from 'react';
import { useAuth } from '../core/auth/AuthProvider';
import { listarMembros } from '../modulos/membros/casos-de-uso/repositorioMembros';
import { listarMedicamentos } from '../modulos/medicamentos/casos-de-uso/repositorioMedicamentos';
import { listarVacinas } from '../modulos/vacinas/casos-de-uso/repositorioVacinas';
import { calcularAlertas } from './alertas';
import type { Alerta } from '../types/dominio';

export function useAlertas() {
  const { usuario, familiaId } = useAuth();
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!usuario || !familiaId) {
        setAlertas([]);
        return;
      }
      try {
        const [membros, medicamentos, vacinas] = await Promise.all([
          listarMembros(familiaId),
          listarMedicamentos(familiaId),
          listarVacinas(familiaId),
        ]);
        if (ativo) setAlertas(calcularAlertas(membros, medicamentos, vacinas, []));
      } catch (err) {
        console.error('[useAlertas] Erro ao carregar alertas:', err);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [usuario, familiaId]);

  return alertas;
}
