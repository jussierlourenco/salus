import JSZip from 'jszip';
import {
  gerarFichaMd,
  gerarMedicamentosMd,
  gerarExamesMd,
  gerarHistoricoMd,
  gerarGeneticaMd,
  gerarIndiceMd,
} from '../../dominio/markdown';
import type { Membro, Medicamento, Exame, Vacina, Evento } from '../../types/dominio';

export interface DadosExportacao {
  membros: Membro[];
  medicamentos: Medicamento[];
  exames: Exame[];
  vacinas: Vacina[];
  eventos: Evento[];
}

export async function exportarParaZip(dados: DadosExportacao): Promise<Blob> {
  const zip = new JSZip();

  const indiceContent = gerarIndiceMd(dados.membros, dados.medicamentos, dados.vacinas);
  zip.file('_index.md', indiceContent);

  for (const membro of dados.membros) {
    const pastaMembro = membro.tipo === 'pessoa'
      ? `Membros/Pessoas/${membro.nome}`
      : `Membros/Pets/${membro.tipo === 'cao' ? 'Cao' : membro.tipo === 'gato' ? 'Gato' : 'Outro'}/${membro.nome}`;

    const meds = dados.medicamentos.filter((m) => m.membro_id === membro.id);
    const exs = dados.exames.filter((e) => e.membro_id === membro.id);
    const evs = dados.eventos.filter((e) => e.membro_id === membro.id);

    zip.file(`${pastaMembro}/Ficha.md`, gerarFichaMd(membro));
    zip.file(`${pastaMembro}/Medicamentos.md`, gerarMedicamentosMd(membro, meds));
    zip.file(`${pastaMembro}/Exames.md`, gerarExamesMd(membro, exs));
    zip.file(`${pastaMembro}/Historico.md`, gerarHistoricoMd(membro, evs));
    zip.file(`${pastaMembro}/Genetica.md`, gerarGeneticaMd(membro));
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function baixarArquivo(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
