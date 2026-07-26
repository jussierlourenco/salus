import { useState, useCallback, useEffect, type ComponentType } from 'react';
import { Card, Botao, Badge, Carregando } from '../../core/ui';
import {
  Inbox, Upload, FileText, Image, Mic, Sparkles, X,
  Check, Pill, Activity, Heart, Calendar, ChevronDown, ChevronUp,
  AlertTriangle, User, FileWarning, SkipForward
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthProvider';
import { useConfiguracao } from '../../core/config/ConfigContext';
import { criarProvedor } from '../../core/ia/interface';
import { listarMembros } from '../../modulos/membros/casos-de-uso/repositorioMembros';
import { salvarMedicamento } from '../../modulos/medicamentos/casos-de-uso/repositorioMedicamentos';
import { salvarExame } from '../../modulos/exames/casos-de-uso/repositorioExames';
import { salvarVacina } from '../../modulos/vacinas/casos-de-uso/repositorioVacinas';
import { salvarEvento } from '../../core/database/repositorio';
import { salvarCaixaEntrada, atualizarCaixaEntrada } from '../../modulos/caixa-entrada/casos-de-uso/repositorioCaixaEntrada';
import { salvarArquivoLocal } from '../../core/storage/indexedDB';
import { baixarArquivo } from '../../core/storage/exportImport';
import type { Membro } from '../../modulos/membros/entidades/membro';
import type { PropostaExtracao } from '../../types/dominio';

// ── Tipos internos ──

interface PropostaArquivo {
  id: string;
  arquivo: File;
  proposta: PropostaExtracao;
  ok: boolean;
  erro?: string;
}

interface ItemSelecao {
  id: string;
  grupo: 'medicamento' | 'exame' | 'vacina' | 'evento';
  resumo: string;
  detalhe: string;
  aceito: boolean;
}

// ── Helpers de exibição (escopo módulo) ──

function iconeArquivo(mime: string) {
  if (mime.startsWith('image/')) return <Image size={18} className="text-purple-400" />;
  if (mime.startsWith('audio/')) return <Mic size={18} className="text-alerta-400" />;
  return <FileText size={18} className="text-salus-400" />;
}

type IconeComponente = ComponentType<{ size?: number; className?: string }>;

const corGrupo: Record<string, { icone: IconeComponente; cor: string; bg: string }> = {
  medicamento: { icone: Pill, cor: 'text-alerta-400', bg: 'bg-alerta-600/10' },
  exame: { icone: Activity, cor: 'text-salus-400', bg: 'bg-salus-600/10' },
  vacina: { icone: Heart, cor: 'text-purple-400', bg: 'bg-purple-600/10' },
  evento: { icone: Calendar, cor: 'text-amber-400', bg: 'bg-amber-600/10' },
};

const labelGrupo: Record<string, string> = {
  medicamento: 'Medicamentos',
  exame: 'Exames',
  vacina: 'Vacinas',
  evento: 'Eventos',
};

function verificarInconsistenciaTemporal(
  proposta: PropostaExtracao
): { dataDocumento: string; diffDays: number } | null {
  const datas = [
    ...(proposta.exames ?? []).map((e) => e.data),
    ...(proposta.vacinas ?? []).map((v) => v.aplicada_em),
    ...(proposta.eventos ?? []).map((ev) => ev.data),
  ].filter(Boolean) as string[];
  if (datas.length === 0) return null;
  const datasOrdenadas = [...datas].sort();
  const dataDocumento = datasOrdenadas[0]!;
  const hoje = new Date().toISOString().split('T')[0];
  const diffMs = new Date(hoje).getTime() - new Date(dataDocumento).getTime();
  const diffDays = Math.abs(diffMs) / (1000 * 60 * 60 * 24);
  if (diffDays > 3) return { dataDocumento, diffDays: Math.round(diffDays) };
  return null;
}

function fmtDataSimples(d?: string): string {
  if (!d) return '';
  const p = d.split('T')[0]!.split('-');
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
  return d;
}

// ── Componente principal ──

export function CaixaDeEntrada() {
  const { usuario } = useAuth();
  const { config } = useConfiguracao();

  const temChaveIA = Boolean(config.provedor_ia?.chave);

  // Upload
  const [arrastando, setArrastando] = useState(false);
  const [arquivos, setArquivos] = useState<File[]>([]);

  // Pipeline
  const [etapa, setEtapa] = useState<'upload' | 'extraindo' | 'proposta' | 'salvando'>('upload');
  const [propostas, setPropostas] = useState<PropostaArquivo[]>([]);
  const [progressoExtraindo, setProgressoExtraindo] = useState(0);
  const [totalExtrair, setTotalExtrair] = useState(0);

  // Proposta UI state
  const [itensSelecao, setItensSelecao] = useState<Map<string, ItemSelecao[]>>(new Map());
  const [membroPorProposta, setMembroPorProposta] = useState<Record<string, string>>({});
  const [msgErro, setMsgErro] = useState('');
  const [msgSucesso, setMsgSucesso] = useState('');

  // Track Firestore doc IDs for real-time timeline updates
  const [firestoreDocIds, setFirestoreDocIds] = useState<Record<string, string>>({});

  // Dados auxiliares
  const [membros, setMembros] = useState<Membro[]>([]);
  const [contextoFamilia, setContextoFamilia] = useState('');

  useEffect(() => {
    if (!usuario) return;
    listarMembros(usuario.uid).then((lista) => {
      setMembros(lista);
      setContextoFamilia(
        lista
          .map((m) => `id:${m.id} = ${m.nome} (${m.tipo})`)
          .join('; ')
      );
    });
  }, [usuario]);

  // ── Upload handlers ──

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    setArquivos((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    setMsgErro('');
    setMsgSucesso('');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(true);
  }, []);

  const handleDragLeave = useCallback(() => setArrastando(false), []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArquivos((prev) => [...prev, ...Array.from(e.target.files!)]);
      setMsgErro('');
      setMsgSucesso('');
    }
  }, []);

  const removerArquivo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  };

  // ── IA Extraction ──

  const extrairComIA = async () => {
    if (!usuario || arquivos.length === 0 || !temChaveIA) return;

    setMsgErro('');
    setEtapa('extraindo');
    setProgressoExtraindo(0);
    setTotalExtrair(arquivos.length);

    const provedor = criarProvedor(config.provedor_ia);
    const uid = usuario.uid;
    const agoraExtraindo = Date.now();
    const resultados: PropostaArquivo[] = [];
    const docIds: Record<string, string> = {};

    // 1. Pre-save each file to Firestore as 'processando' so it appears in the timeline
    for (let i = 0; i < arquivos.length; i++) {
      const arquivo = arquivos[i];
      try {
        const fsId = await salvarCaixaEntrada(uid, {
          nome_arquivo: arquivo.name,
          mime_type: arquivo.type,
          status: 'processando',
        });
        const propostaId = `${arquivo.name}-${agoraExtraindo}-${i}`;
        docIds[propostaId] = fsId;
      } catch {
        // If pre-save fails, continue without timeline preview
      }
    }
    setFirestoreDocIds(docIds);

    // 2. Extraction loop
    for (let i = 0; i < arquivos.length; i++) {
      const arquivo = arquivos[i];
      const propostaId = `${arquivo.name}-${agoraExtraindo}-${i}`;
      try {
        const buffer = await arquivo.arrayBuffer();
        const proposta = await provedor.extrairDocumento(
          buffer,
          arquivo.type,
          arquivo.name,
          contextoFamilia
        );

        resultados.push({
          id: propostaId,
          arquivo,
          proposta,
          ok: true,
        });
      } catch (err) {
        resultados.push({
          id: propostaId,
          arquivo,
          proposta: {},
          ok: false,
          erro: err instanceof Error ? err.message : 'Erro desconhecido ao processar o arquivo.',
        });
        // Mark failed items as 'descartado' in Firestore
        const fsId = docIds[propostaId];
        if (fsId) {
          try {
            await atualizarCaixaEntrada(uid, fsId, {
              status: 'descartado',
              proposta: { notas: err instanceof Error ? err.message : 'Falha na extração' },
            });
          } catch { /* cleanup best-effort */ }
        }
      }
      setProgressoExtraindo(i + 1);
    }

    setPropostas(resultados);

    // Inicializa estados da proposta
    const membroMap: Record<string, string> = {};
    const itensMap = new Map<string, ItemSelecao[]>();

    for (const r of resultados) {
      if (!r.ok) continue;

      const membroSugerido = resolverMembro(r.proposta.membro_id);
      membroMap[r.id] = membroSugerido ?? '';

      const itens: ItemSelecao[] = [
        ...(r.proposta.medicamentos ?? []).map((m, idx) => ({
          id: `med-${r.id}-${idx}`,
          grupo: 'medicamento' as const,
          resumo: m.nome ?? 'Medicamento',
          detalhe: [m.dose, m.frequencia].filter(Boolean).join(' · '),
          aceito: true,
        })),
        ...(r.proposta.exames ?? []).map((e, idx) => ({
          id: `ex-${r.id}-${idx}`,
          grupo: 'exame' as const,
          resumo: e.marcador ?? 'Exame',
          detalhe: `${e.valor ?? ''} ${e.unidade ?? ''}${e.flag ? ` (${e.flag})` : ''}`,
          aceito: true,
        })),
        ...(r.proposta.vacinas ?? []).map((v, idx) => ({
          id: `vac-${r.id}-${idx}`,
          grupo: 'vacina' as const,
          resumo: v.nome ?? 'Vacina',
          detalhe: v.aplicada_em ? `Aplicada: ${v.aplicada_em}` : '',
          aceito: true,
        })),
        ...(r.proposta.eventos ?? []).map((ev, idx) => ({
          id: `evt-${r.id}-${idx}`,
          grupo: 'evento' as const,
          resumo: ev.descricao ?? 'Evento',
          detalhe: `${ev.tipo ?? ''}${ev.data ? ` em ${ev.data}` : ''}`,
          aceito: true,
        })),
      ];
      itensMap.set(r.id, itens);
    }

    setMembroPorProposta(membroMap);
    setItensSelecao(itensMap);
    setEtapa('proposta');
  };

  const resolverMembro = (membroRef?: string): string | undefined => {
    if (!membroRef) return undefined;
    const porId = membros.find((m) => m.id === membroRef);
    if (porId) return porId.id;
    const porNome = membros.find(
      (m) => m.nome.toLowerCase() === membroRef.toLowerCase()
    );
    return porNome?.id;
  };

  // ── Interação com a proposta ──

  const alternarItem = (propostaId: string, itemId: string) => {
    setItensSelecao((prev) => {
      const copia = new Map(prev);
      const itens = [...(copia.get(propostaId) ?? [])];
      const idx = itens.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        itens[idx] = { ...itens[idx], aceito: !itens[idx].aceito };
        copia.set(propostaId, itens);
      }
      return copia;
    });
  };

  const alternarGrupo = (propostaId: string, grupo: ItemSelecao['grupo'], valor: boolean) => {
    setItensSelecao((prev) => {
      const copia = new Map(prev);
      const itens = (copia.get(propostaId) ?? []).map((i) =>
        i.grupo === grupo ? { ...i, aceito: valor } : i
      );
      copia.set(propostaId, itens);
      return copia;
    });
  };

  // ── Confirmar e salvar ──

  const confirmar = async () => {
    if (!usuario) return;
    setEtapa('salvando');

    const uid = usuario.uid;
    let salvos = 0;
    const erros: string[] = [];

    for (const proposta of propostas) {
      if (!proposta.ok) continue;

      const membroId = membroPorProposta[proposta.id];
      const itens = itensSelecao.get(proposta.id) ?? [];

      try {
        // Medicamentos
        const medsAceitos = proposta.proposta.medicamentos?.filter((_, idx) =>
          itens.find((i) => i.id === `med-${proposta.id}-${idx}`)?.aceito
        ) ?? [];
        for (const med of medsAceitos) {
          await salvarMedicamento(uid, {
            ...med,
            membro_id: membroId ?? med.membro_id,
            status: 'prescrito' as const,
          });
          salvos++;
        }

        // Exames
        const exsAceitos = proposta.proposta.exames?.filter((_, idx) =>
          itens.find((i) => i.id === `ex-${proposta.id}-${idx}`)?.aceito
        ) ?? [];
        for (const ex of exsAceitos) {
          await salvarExame(uid, {
            ...ex,
            membro_id: membroId ?? ex.membro_id,
            data: ex.data ?? new Date().toISOString().split('T')[0],
          });
          salvos++;
        }

        // Vacinas
        const vacsAceitas = proposta.proposta.vacinas?.filter((_, idx) =>
          itens.find((i) => i.id === `vac-${proposta.id}-${idx}`)?.aceito
        ) ?? [];
        for (const vac of vacsAceitas) {
          await salvarVacina(uid, {
            ...vac,
            membro_id: membroId ?? vac.membro_id,
          });
          salvos++;
        }

        // Eventos
        const evtsAceitos = proposta.proposta.eventos?.filter((_, idx) =>
          itens.find((i) => i.id === `evt-${proposta.id}-${idx}`)?.aceito
        ) ?? [];
        for (const ev of evtsAceitos) {
          await salvarEvento(uid, {
            ...ev,
            membro_id: membroId ?? ev.membro_id,
            data: ev.data ?? new Date().toISOString().split('T')[0],
          });
          salvos++;
        }

        // Salva o arquivo original no IndexedDB (navegador)
        const arquivoId = `ce_${proposta.id}`;
        await salvarArquivoLocal(uid, arquivoId, proposta.arquivo);

        // Download automático do original pro dispositivo
        try {
          baixarArquivo(proposta.arquivo, proposta.arquivo.name);
        } catch {
          // Falha no download não interrompe o fluxo
        }

        // Deriva data_evento do documento
        const datasEncontradas = [
          ...(proposta.proposta.exames ?? []).map((e) => e.data),
          ...(proposta.proposta.vacinas ?? []).map((v) => v.aplicada_em),
          ...(proposta.proposta.eventos ?? []).map((ev) => ev.data),
        ].filter(Boolean) as string[];
        const dataEvento = datasEncontradas.sort()[0] ?? undefined;

        // Atualiza o item existente no Firestore (criado como 'processando')
        const fsId = firestoreDocIds[proposta.id];
        if (fsId) {
          await atualizarCaixaEntrada(uid, fsId, {
            status: 'confirmado',
            proposta: proposta.proposta,
            storage_id: arquivoId,
            storage_tipo: 'indexeddb',
            data_evento: dataEvento,
          });
        } else {
          // Fallback: cria um novo item (caso o pré-save tenha falhado)
          await salvarCaixaEntrada(uid, {
            nome_arquivo: proposta.arquivo.name,
            mime_type: proposta.arquivo.type,
            status: 'confirmado',
            proposta: proposta.proposta,
            storage_id: arquivoId,
            storage_tipo: 'indexeddb',
            data_evento: dataEvento,
          });
        }
      } catch (err) {
        erros.push(`${proposta.arquivo.name}: ${err instanceof Error ? err.message : 'Erro ao salvar'}`);
      }
    }

    if (erros.length === 0) {
      setMsgSucesso(`${salvos} registro(s) salvos! Os arquivos originais foram baixados para o seu dispositivo.`);
    } else {
      setMsgErro(`${salvos} registro(s) salvos, mas ${erros.length} arquivo(s) tiveram erro: ${erros.join('; ')}`);
    }

    setArquivos([]);
    setPropostas([]);
    setItensSelecao(new Map());
    setMembroPorProposta({});
    setEtapa('upload');
  };

  const descartar = async () => {
    // Limpa items 'processando' do Firestore
    if (usuario) {
      for (const fsId of Object.values(firestoreDocIds)) {
        try {
          await atualizarCaixaEntrada(usuario.uid, fsId, { status: 'descartado' });
        } catch {
          // cleanup best-effort
        }
      }
    }
    setFirestoreDocIds({});
    setArquivos([]);
    setPropostas([]);
    setItensSelecao(new Map());
    setMembroPorProposta({});
    setEtapa('upload');
  };

  // ── Render ──

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
          <Inbox size={24} className="text-salus-500" />
          Caixa de Entrada
        </h1>
        <p className="text-texto-secundario mt-1">
          Arraste exames, receitas, laudos ou fotos. A IA extrai os dados e você confirma antes de salvar no banco.
        </p>
      </div>

      {msgSucesso && (
        <div className="p-3 rounded-[var(--radius-md)] text-sm flex items-start gap-2.5 border bg-salus-950/40 border-salus-500/40 text-salus-300 animate-fade-in">
          <Check size={18} className="text-salus-400 shrink-0 mt-0.5" />
          <span>{msgSucesso}</span>
        </div>
      )}
      {msgErro && (
        <div className="p-3 rounded-[var(--radius-md)] text-sm flex items-start gap-2.5 border bg-alerta-950/40 border-alerta-500/40 text-alerta-300 animate-fade-in">
          <AlertTriangle size={18} className="text-alerta-400 shrink-0 mt-0.5" />
          <span>{msgErro}</span>
        </div>
      )}

      {etapa === 'upload' && (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-[var(--radius-xl)] p-12
              flex flex-col items-center justify-center text-center
              transition-all duration-300 cursor-pointer
              ${arrastando
                ? 'border-salus-500 bg-salus-600/10 scale-[1.01]'
                : 'border-borda hover:border-salus-600/50 hover:bg-fundo-card/50'
              }
            `}
          >
            <input
              type="file"
              multiple
              accept=".pdf,image/*,audio/*"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Selecionar arquivos"
            />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              arrastando ? 'bg-salus-600/20' : 'bg-fundo-elevado'
            }`}>
              <Upload size={28} className={arrastando ? 'text-salus-400' : 'text-texto-secundario'} />
            </div>
            <p className="text-lg font-medium text-texto mb-1">
              {arrastando ? 'Solte aqui!' : 'Arraste seus documentos'}
            </p>
            <p className="text-sm text-texto-secundario">
              PDF, fotos, áudios — ou clique para selecionar
            </p>
          </div>

          {arquivos.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-texto">
                    {arquivos.length} {arquivos.length === 1 ? 'arquivo' : 'arquivos'} selecionado(s)
                  </h2>
                  {!temChaveIA && (
                    <p className="text-xs text-alerta-400 mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Configure uma chave de IA em Ajustes para extrair dados automaticamente.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Botao variante="secundario" tamanho="sm" icone={<X size={16} />} onClick={() => setArquivos([])}>
                    Limpar
                  </Botao>
                  <Botao tamanho="sm" icone={<Sparkles size={16} />} disabled={!temChaveIA} onClick={extrairComIA}>
                    Extrair com IA
                  </Botao>
                </div>
              </div>
              <div className="space-y-2">
                {arquivos.map((arquivo, i) => (
                  <div
                    key={`${arquivo.name}-${i}`}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50 group"
                  >
                    {iconeArquivo(arquivo.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-texto truncate">{arquivo.name}</p>
                      <p className="text-xs text-texto-secundario">
                        {(arquivo.size / 1024).toFixed(0)} KB
                        <span className="mx-1">·</span>
                        <Badge variante="neutro">{arquivo.type.split('/')[1]?.toUpperCase() ?? 'ARQUIVO'}</Badge>
                      </p>
                    </div>
                    <button onClick={() => removerArquivo(i)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-vencido-500 transition-all" aria-label={`Remover ${arquivo.name}`}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {arquivos.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icone: FileText, titulo: 'Exames e Laudos', desc: 'PDFs de laboratório' },
                { icone: Image, titulo: 'Receitas e Fotos', desc: 'Fotos de receitas médicas' },
                { icone: Mic, titulo: 'Orientações em Áudio', desc: 'Gravações do médico' },
              ].map(({ icone: Icone, titulo, desc }) => (
                <Card key={titulo} padding="sm" className="text-center">
                  <Icone size={24} className="text-texto-secundario/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-texto">{titulo}</p>
                  <p className="text-xs text-texto-secundario">{desc}</p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {etapa === 'extraindo' && (
        <div className="py-16">
          <Carregando texto={`Extraindo dados com IA... (${progressoExtraindo}/${totalExtrair})`} />
        </div>
      )}

      {etapa === 'proposta' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-texto flex items-center gap-2">
                <Sparkles size={22} className="text-salus-400" />
                Proposta de Extração
              </h2>
              <p className="text-sm text-texto-secundario">
                Revise e selecione os itens que deseja salvar no Firestore.
              </p>
            </div>
            <div className="flex gap-2">
              <Botao variante="fantasma" tamanho="sm" onClick={descartar} icone={<SkipForward size={16} />}>
                Descartar Tudo
              </Botao>
              <Botao tamanho="sm" onClick={confirmar} icone={<Check size={16} />}>
                Confirmar e Salvar
              </Botao>
            </div>
          </div>

          {propostas.map((proposta) => (
            <PropostaCard
              key={proposta.id}
              proposta={proposta}
              membros={membros}
              membroSelecionado={membroPorProposta[proposta.id] ?? ''}
              itens={itensSelecao.get(proposta.id) ?? []}
              onAlternarItem={(itemId) => alternarItem(proposta.id, itemId)}
              onAlternarGrupo={(grupo, valor) => alternarGrupo(proposta.id, grupo, valor)}
              onMembroChange={(membroId) =>
                setMembroPorProposta((prev) => ({ ...prev, [proposta.id]: membroId }))
              }
              corGrupo={corGrupo}
              labelGrupo={labelGrupo}
            />
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Botao variante="fantasma" onClick={descartar} icone={<SkipForward size={16} />}>
              Descartar Tudo
            </Botao>
            <Botao onClick={confirmar} icone={<Check size={16} />}>
              Confirmar e Salvar no Firestore
            </Botao>
          </div>
        </div>
      )}

      {etapa === 'salvando' && (
        <div className="py-16">
          <Carregando texto="Salvando dados no Firestore..." />
        </div>
      )}
    </div>
  );
}

// ── Subcomponente: card de proposta de um arquivo ──

interface PropostaCardProps {
  proposta: PropostaArquivo;
  membros: Membro[];
  membroSelecionado: string;
  itens: ItemSelecao[];
  onAlternarItem: (itemId: string) => void;
  onAlternarGrupo: (grupo: ItemSelecao['grupo'], valor: boolean) => void;
  onMembroChange: (membroId: string) => void;
  corGrupo: Record<string, { icone: IconeComponente; cor: string; bg: string }>;
  labelGrupo: Record<string, string>;
}

function PropostaCard({
  proposta,
  membros,
  membroSelecionado,
  itens,
  onAlternarItem,
  onAlternarGrupo,
  onMembroChange,
  corGrupo,
  labelGrupo,
}: PropostaCardProps) {
  const [expandido, setExpandido] = useState(true);
  const inconsistencia = useMemo(
    () => verificarInconsistenciaTemporal(proposta.proposta),
    [proposta.proposta],
  );

  if (!proposta.ok) {
    return (
      <Card className="border-alerta-500/40">
        <div className="flex items-center gap-3">
          <FileWarning size={20} className="text-alerta-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-texto truncate">{proposta.arquivo.name}</p>
            <p className="text-xs text-alerta-400">{proposta.erro}</p>
          </div>
        </div>
      </Card>
    );
  }

  const grupos = ['medicamento', 'exame', 'vacina', 'evento'] as const;
  const totalItens = itens.length;
  const aceitos = itens.filter((i) => i.aceito).length;

  return (
    <Card className="border-salus-600/20">
      <button onClick={() => setExpandido(!expandido)} className="flex items-center gap-3 w-full text-left">
        {iconeArquivo(proposta.arquivo.type)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-texto truncate">{proposta.arquivo.name}</p>
            {proposta.proposta.tipo_documento && (
              <Badge variante="salus">{proposta.proposta.tipo_documento}</Badge>
            )}
          </div>
          <p className="text-xs text-texto-secundario">
            {totalItens} {totalItens === 1 ? 'item extraído' : 'itens extraídos'} · {aceitos}/{totalItens} selecionados
          </p>
        </div>
        {expandido ? <ChevronUp size={18} className="text-texto-secundario" /> : <ChevronDown size={18} className="text-texto-secundario" />}
      </button>

      {expandido && (
        <div className="mt-4 pt-4 border-t border-borda space-y-4">
          {/* Seletor de membro */}
          <div className="flex items-center gap-3">
            <User size={16} className="text-texto-secundario shrink-0" />
            <label className="text-sm text-texto-secundario shrink-0">Vincular a:</label>
            <select
              value={membroSelecionado}
              onChange={(e) => onMembroChange(e.target.value)}
              className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm focus:outline-none focus:border-salus-500"
            >
              <option value="">Selecione um membro da família</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} ({m.tipo === 'pessoa' ? 'Pessoa' : m.tipo})
                </option>
              ))}
            </select>
          </div>

          {/* Alerta de inconsistência temporal */}
          {inconsistencia && (
            <div className="p-3 rounded-[var(--radius-md)] text-xs flex items-start gap-2.5 border bg-amber-950/30 border-amber-500/30 text-amber-300 animate-fade-in">
              <Calendar size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                A data de hoje é diferente da data deste documento (<strong>{fmtDataSimples(inconsistencia.dataDocumento)}</strong> — diferença de {inconsistencia.diffDays} {inconsistencia.diffDays === 1 ? 'dia' : 'dias'}). O registro será organizado por essa data na linha do tempo.
              </span>
            </div>
          )}

          {/* Seções de cada grupo */}
          {grupos.map((grupo) => {
            const itensGrupo = itens.filter((i) => i.grupo === grupo);
            if (itensGrupo.length === 0) return null;

            const todosAceitos = itensGrupo.every((i) => i.aceito);
            const { icone: Icone, cor, bg } = corGrupo[grupo];

            return (
              <div key={grupo} className="p-3 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-[var(--radius-sm)] ${bg} flex items-center justify-center`}>
                      <Icone size={14} className={cor} />
                    </div>
                    <span className="text-sm font-medium text-texto">
                      {labelGrupo[grupo]} ({itensGrupo.length})
                    </span>
                  </div>
                  <button
                    onClick={() => onAlternarGrupo(grupo, !todosAceitos)}
                    className={`text-xs px-2 py-1 rounded-[var(--radius-sm)] border transition-colors touch-target min-h-0 ${
                      todosAceitos
                        ? 'bg-salus-600/10 border-salus-600/30 text-salus-400'
                        : 'bg-fundo-elevado border-borda text-texto-secundario'
                    }`}
                  >
                    {todosAceitos ? 'Todos selecionados' : 'Selecionar todos'}
                  </button>
                </div>

                <div className="space-y-1">
                  {itensGrupo.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onAlternarItem(item.id)}
                      className={`
                        flex items-center gap-3 w-full p-2.5 rounded-[var(--radius-sm)] text-left
                        border transition-all
                        ${item.aceito
                          ? 'border-salus-600/20 bg-salus-600/5'
                          : 'border-transparent opacity-50 hover:opacity-80'
                        }
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all
                        ${item.aceito ? 'bg-salus-600 border-salus-600' : 'border-borda'}
                      `}>
                        {item.aceito && <Check size={10} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-texto truncate">{item.resumo}</p>
                        {item.detalhe && <p className="text-xs text-texto-secundario truncate">{item.detalhe}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Markdown preview */}
          {proposta.proposta.markdown_gerado && (
            <PropostaMarkdown md={proposta.proposta.markdown_gerado} />
          )}

          {proposta.proposta.notas && (
            <p className="text-xs text-texto-secundario italic bg-fundo/50 p-2 rounded-[var(--radius-sm)]">
              {proposta.proposta.notas}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Preview Markdown ──

function PropostaMarkdown({ md }: { md: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div>
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 text-xs text-texto-secundario hover:text-texto transition-colors"
      >
        {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {aberto ? 'Ocultar' : 'Ver'} prévia do Markdown gerado
      </button>
      {aberto && (
        <pre className="mt-2 p-3 rounded-[var(--radius-md)] bg-fundo/80 border border-borda/50 text-xs text-texto-secundario overflow-x-auto max-h-48 overflow-y-auto">
          {md}
        </pre>
      )}
    </div>
  );
}
