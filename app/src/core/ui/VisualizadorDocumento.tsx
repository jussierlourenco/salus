import { useEffect, useState, useCallback } from 'react';
import { X, FileText, Download, Eye, FileWarning } from 'lucide-react';
import { Botao } from './Botao';
import { useAuth } from '../auth/AuthProvider';
import { obterArquivoLocal } from '../storage/indexedDB';
import type { PropostaExtracao } from '../../types/dominio';

interface VisualizadorDocumentoProps {
  /** ID do storage (IndexedDB) */
  storageId: string;
  /** Proposta com markdown_gerado */
  proposta?: PropostaExtracao;
  /** Nome do arquivo original */
  nomeArquivo: string;
  /** MIME type */
  mimeType: string;
  /** Fechar modal */
  onFechar: () => void;
}

export function VisualizadorDocumento({
  storageId,
  proposta,
  nomeArquivo,
  mimeType,
  onFechar,
}: VisualizadorDocumentoProps) {
  const { usuario } = useAuth();
  const [urlOriginal, setUrlOriginal] = useState<string | null>(null);
  const [carregandoOriginal, setCarregandoOriginal] = useState(false);
  const [erroOriginal, setErroOriginal] = useState(false);
  const [aba, setAba] = useState<'markdown' | 'original'>('markdown');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onFechar]);

  const carregarOriginal = useCallback(async () => {
    if (!usuario || urlOriginal || carregandoOriginal) return;
    setCarregandoOriginal(true);
    setErroOriginal(false);
    try {
      const resultado = await obterArquivoLocal(usuario.uid, storageId);
      if (!resultado) {
        setErroOriginal(true);
        return;
      }
      const blob = new Blob([resultado.arquivo], { type: mimeType });
      setUrlOriginal(URL.createObjectURL(blob));
      setAba('original');
    } catch {
      setErroOriginal(true);
    } finally {
      setCarregandoOriginal(false);
    }
  }, [usuario, storageId, mimeType, urlOriginal, carregandoOriginal]);

  const handleDownload = useCallback(() => {
    if (!urlOriginal) return;
    const a = document.createElement('a');
    a.href = urlOriginal;
    a.download = nomeArquivo;
    a.click();
  }, [urlOriginal, nomeArquivo]);

  const isImagem = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90dvh] flex flex-col rounded-[var(--radius-xl)] bg-fundo-card border border-borda shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-borda shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={18} className="text-salus-400 shrink-0" />
            <h2 className="text-sm font-semibold text-texto truncate">{nomeArquivo}</h2>
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center hover:bg-fundo-elevado text-texto-secundario hover:text-texto transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 px-4 pt-3 shrink-0">
          <button
            onClick={() => setAba('markdown')}
            className={`px-3 py-1.5 text-xs rounded-[var(--radius-sm)] font-medium transition-colors ${
              aba === 'markdown'
                ? 'bg-salus-600/15 text-salus-400 border border-salus-600/30'
                : 'text-texto-secundario hover:text-texto border border-transparent'
            }`}
          >
            Dados Extraídos
          </button>
          <button
            onClick={() => {
              if (!urlOriginal) carregarOriginal();
              else setAba('original');
            }}
            disabled={carregandoOriginal}
            className={`px-3 py-1.5 text-xs rounded-[var(--radius-sm)] font-medium transition-colors ${
              aba === 'original'
                ? 'bg-salus-600/15 text-salus-400 border border-salus-600/30'
                : 'text-texto-secundario hover:text-texto border border-transparent'
            }`}
          >
            {carregandoOriginal ? 'Carregando...' : 'Documento Original'}
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {aba === 'markdown' ? (
            proposta?.markdown_gerado ? (
              <pre className="text-sm text-texto whitespace-pre-wrap font-sans leading-relaxed">
                {proposta.markdown_gerado}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-texto-secundario">
                <FileText size={32} className="mb-2 opacity-40" />
                <p className="text-sm">Nenhum dado extraído disponível.</p>
              </div>
            )
          ) : erroOriginal ? (
            <div className="flex flex-col items-center justify-center py-12 text-texto-secundario">
              <FileWarning size={32} className="mb-2 text-alerta-400" />
              <p className="text-sm font-medium text-alerta-400">Arquivo original não encontrado</p>
              <p className="text-xs mt-1">O arquivo pode ter sido removido do armazenamento local.</p>
            </div>
          ) : urlOriginal ? (
            <div className="flex flex-col items-center">
              {isImagem ? (
                <img src={urlOriginal} alt={nomeArquivo} className="max-w-full max-h-[60dvh] rounded-[var(--radius-md)] object-contain" />
              ) : isPdf ? (
                <iframe src={urlOriginal} className="w-full h-[60dvh] rounded-[var(--radius-md)]" title={nomeArquivo} />
              ) : (
                <div className="flex flex-col items-center py-8 text-texto-secundario">
                  <FileText size={40} className="mb-2 opacity-40" />
                  <p className="text-sm">Pré-visualização não disponível para este tipo de arquivo.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Eye size={32} className="mb-2 text-texto-secundario/40" />
              <p className="text-sm text-texto-secundario mb-4">Clique em "Carregar Original" para visualizar.</p>
              <Botao tamanho="sm" onClick={carregarOriginal} icone={<Eye size={16} />}>
                Carregar Original
              </Botao>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-borda shrink-0">
          <p className="text-xs text-texto-secundario truncate">
            {isImagem ? 'Imagem' : isPdf ? 'PDF' : mimeType} · {nomeArquivo}
          </p>
          <Botao
            tamanho="sm"
            variante="secundario"
            icone={<Download size={14} />}
            onClick={urlOriginal ? handleDownload : carregarOriginal}
            disabled={carregandoOriginal && !urlOriginal}
          >
            {urlOriginal ? 'Baixar' : carregandoOriginal ? 'Carregando...' : 'Carregar e Baixar'}
          </Botao>
        </div>
      </div>
    </div>
  );
}
