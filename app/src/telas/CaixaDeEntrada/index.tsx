import { useState, useCallback } from 'react';
import { Card, Botao, Badge } from '../../core/ui';
import { Inbox, Upload, FileText, Image, Mic, Sparkles, PenLine, X } from 'lucide-react';

export function CaixaDeEntrada() {
  const [arrastando, setArrastando] = useState(false);
  const [arquivos, setArquivos] = useState<File[]>([]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const files = Array.from(e.dataTransfer.files);
    setArquivos((prev) => [...prev, ...files]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(true);
  }, []);

  const handleDragLeave = useCallback(() => setArrastando(false), []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArquivos((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removerArquivo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  };

  const iconeArquivo = (mime: string) => {
    if (mime.startsWith('image/')) return <Image size={18} className="text-purple-400" />;
    if (mime.startsWith('audio/')) return <Mic size={18} className="text-alerta-400" />;
    return <FileText size={18} className="text-salus-400" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
          <Inbox size={24} className="text-salus-500" />
          Caixa de Entrada
        </h1>
        <p className="text-texto-secundario mt-1">
          Arraste exames, receitas, laudos ou fotos. A IA extrai os dados e gera Markdown para sua aprovação.
        </p>
      </div>

      {/* Drop Zone */}
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

      {/* File List */}
      {arquivos.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-texto">
              {arquivos.length} {arquivos.length === 1 ? 'arquivo' : 'arquivos'} selecionados
            </h2>
            <div className="flex gap-2">
              <Botao
                variante="secundario"
                tamanho="sm"
                icone={<PenLine size={16} />}
              >
                Preencher manual
              </Botao>
              <Botao
                tamanho="sm"
                icone={<Sparkles size={16} />}
              >
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
                <button
                  onClick={() => removerArquivo(i)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-vencido-500 transition-all"
                  aria-label={`Remover ${arquivo.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
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
    </div>
  );
}
