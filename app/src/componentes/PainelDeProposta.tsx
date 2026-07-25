/**
 * PainelDeProposta — o componente que define o Salus.
 *
 * Toda saída da IA que toca em dados vira uma Proposta renderizada aqui.
 * O usuário vê campo a campo: valor atual → valor novo, e decide Confirmar, Editar ou Descartar.
 * Nenhum dado é gravado sem passar por este componente.
 */

import { useState } from 'react';
import { Card, Botao, Badge } from './ui';
import { Check, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface CampoProposta {
  campo: string;
  valorAtual?: string;
  valorNovo: string;
  aceito: boolean;
}

interface PainelDePropostaProps {
  titulo: string;
  descricao?: string;
  campos: CampoProposta[];
  markdownPreview?: string;
  onConfirmar: (camposAceitos: CampoProposta[]) => void;
  onDescartar: () => void;
  carregando?: boolean;
}

export function PainelDeProposta({
  titulo,
  descricao,
  campos: camposIniciais,
  markdownPreview,
  onConfirmar,
  onDescartar,
  carregando = false,
}: PainelDePropostaProps) {
  const [campos, setCampos] = useState(camposIniciais);
  const [mostrarMd, setMostrarMd] = useState(false);

  const toggleCampo = (index: number) => {
    setCampos((prev) =>
      prev.map((c, i) => (i === index ? { ...c, aceito: !c.aceito } : c))
    );
  };

  const aceitos = campos.filter((c) => c.aceito);

  return (
    <Card className="animate-slide-up border-salus-600/30">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={18} className="text-salus-400" />
            <h3 className="font-semibold text-texto">{titulo}</h3>
          </div>
          {descricao && (
            <p className="text-sm text-texto-secundario">{descricao}</p>
          )}
        </div>
        <Badge variante="salus">Proposta</Badge>
      </div>

      {/* Fields */}
      <div className="space-y-2 mb-4">
        {campos.map((campo, i) => (
          <button
            key={`${campo.campo}-${i}`}
            onClick={() => toggleCampo(i)}
            className={`
              flex items-start gap-3 w-full p-3 rounded-[var(--radius-md)] text-left
              border transition-all
              ${campo.aceito
                ? 'border-salus-600/30 bg-salus-600/5'
                : 'border-borda/50 bg-fundo/30 opacity-60'
              }
            `}
          >
            <div className={`
              w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5
              transition-all
              ${campo.aceito
                ? 'bg-salus-600 border-salus-600'
                : 'border-borda'
              }
            `}>
              {campo.aceito && <Check size={12} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-texto-secundario mb-0.5">{campo.campo}</p>
              {campo.valorAtual && (
                <p className="text-sm text-texto-secundario line-through mb-0.5">
                  {campo.valorAtual}
                </p>
              )}
              <p className="text-sm text-texto">{campo.valorNovo}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Markdown Preview */}
      {markdownPreview && (
        <div className="mb-4">
          <button
            onClick={() => setMostrarMd(!mostrarMd)}
            className="flex items-center gap-2 text-sm text-texto-secundario hover:text-texto transition-colors"
          >
            {mostrarMd ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {mostrarMd ? 'Esconder' : 'Ver'} Markdown gerado
          </button>
          {mostrarMd && (
            <pre className="mt-2 p-3 rounded-[var(--radius-md)] bg-fundo/80 border border-borda/50 text-xs text-texto-secundario overflow-x-auto max-h-64 overflow-y-auto">
              {markdownPreview}
            </pre>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-borda">
        <p className="text-xs text-texto-secundario">
          {aceitos.length} de {campos.length} campos selecionados
        </p>
        <div className="flex gap-2">
          <Botao
            variante="fantasma"
            tamanho="sm"
            onClick={onDescartar}
            icone={<X size={16} />}
          >
            Descartar
          </Botao>
          <Botao
            tamanho="sm"
            onClick={() => onConfirmar(aceitos)}
            disabled={aceitos.length === 0}
            carregando={carregando}
            icone={<Check size={16} />}
          >
            Confirmar
          </Botao>
        </div>
      </div>
    </Card>
  );
}
