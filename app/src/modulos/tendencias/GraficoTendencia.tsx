import { useState, useMemo, useRef, useEffect } from 'react';
import type { Exame } from '../exames/entidades/exame';
import {
  parseValorNumerico,
  formatarDataCurta,
  formatarData,
  extrairFaixaReferencia,
  gerarYTicks,
} from './utils';

interface GraficoTendenciaProps {
  exames: Exame[];
  marcador: string;
}

interface PontoGrafico {
  data: string;
  valor: number;
  valorOriginal: string;
  unidade: string;
  flag: string;
  faixa: { min: number; max: number } | null;
}

const MARGEM = { top: 20, right: 20, bottom: 40, left: 56 };
const SVG_W = 700;
const SVG_H = 280;
const CHART_W = SVG_W - MARGEM.left - MARGEM.right;
const CHART_H = SVG_H - MARGEM.top - MARGEM.bottom;

export function GraficoTendencia({ exames, marcador }: GraficoTendenciaProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const dados = useMemo(() => {
    return exames
      .map((e) => {
        const valorNum = parseValorNumerico(e.valor);
        if (valorNum === null) return null;
        return {
          data: e.data,
          valor: valorNum,
          valorOriginal: e.valor,
          unidade: e.unidade || '',
          flag: e.flag,
          faixa: extrairFaixaReferencia(e.faixa_referencia_laudo),
        };
      })
      .filter((d): d is PontoGrafico => d !== null)
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [exames]);

  const { escalas, yTicks } = useMemo(() => {
    if (dados.length === 0) {
      return { escalas: { x: (_i: number) => 0, y: (_v: number) => 0 }, yTicks: [] };
    }
    const valores = dados.map((d) => d.valor);
    let min = Math.min(...valores);
    let max = Math.max(...valores);
    if (min === max) {
      min = min - 5;
      max = max + 5;
    }
    const padding = (max - min) * 0.1;
    const yMin = Math.max(0, min - padding);
    const yMax = max + padding;
    const yRange = yMax - yMin || 1;

    return {
      escalas: {
        x: (i: number) =>
          dados.length <= 1
            ? MARGEM.left + CHART_W / 2
            : MARGEM.left + (i / (dados.length - 1)) * CHART_W,
        y: (v: number) =>
          MARGEM.top + CHART_H - ((v - yMin) / yRange) * CHART_H,
      },
      yTicks: gerarYTicks(yMin, yMax),
    };
  }, [dados]);

  const corDaFlag = (flag: string) => {
    switch (flag) {
      case 'alto':
        return { fill: '#f59e0b', stroke: '#d97706', label: 'Alto' };
      case 'baixo':
        return { fill: '#3b82f6', stroke: '#2563eb', label: 'Baixo' };
      case 'normal':
        return { fill: '#14b8a6', stroke: '#0d9488', label: 'Normal' };
      default:
        return { fill: '#94a3b8', stroke: '#64748b', label: '' };
    }
  };

  const pathD = dados
    .map((d, i) => {
      const x = escalas.x(i);
      const y = escalas.y(d.valor);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  // Reference range band from the first point that has one
  const faixaRef = dados.find((d) => d.faixa);
  let rectFaixa = null;
  if (faixaRef?.faixa) {
    const y1 = escalas.y(faixaRef.faixa.max);
    const y2 = escalas.y(faixaRef.faixa.min);
    rectFaixa = (
      <rect
        x={MARGEM.left}
        y={y1}
        width={CHART_W}
        height={y2 - y1}
        fill="var(--color-salus-500)"
        fillOpacity={0.06}
        rx={4}
      />
    );
  }

  const handleMouseEnter = (i: number, e: React.MouseEvent) => {
    setHoveredIdx(i);
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      setTooltipPos({
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top - 50,
      });
    }
  };

  if (dados.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-auto select-none"
        style={{ minHeight: 200 }}
      >
        {/* Grid horizontal */}
        {yTicks.map((tick, i) => {
          const y = escalas.y(tick);
          return (
            <g key={i}>
              <line
                x1={MARGEM.left}
                y1={y}
                x2={MARGEM.left + CHART_W}
                y2={y}
                stroke="var(--color-borda)"
                strokeOpacity={0.4}
                strokeDasharray={i === 0 ? '0' : '4,2'}
              />
              <text
                x={MARGEM.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-texto-secundario"
                style={{ fontSize: 10 }}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Reference range */}
        {rectFaixa}

        {/* Linha principal */}
        {dados.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-salus-500)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.8}
          />
        )}

        {/* Pontos */}
        {dados.map((d, i) => {
          const cx = escalas.x(i);
          const cy = escalas.y(d.valor);
          const cores = corDaFlag(d.flag);
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={i}
              onMouseEnter={(e) => handleMouseEnter(i, e)}
              onMouseMove={(e) => {
                const svgRect = svgRef.current?.getBoundingClientRect();
                if (svgRect) {
                  setTooltipPos({
                    x: e.clientX - svgRect.left,
                    y: e.clientY - svgRect.top - 50,
                  });
                }
              }}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={cx} cy={cy} r={isHovered ? 8 : 5} fill={cores.fill} stroke={cores.stroke} strokeWidth={2} />
              {isHovered && (
                <circle cx={cx} cy={cy} r={11} fill="none" stroke={cores.fill} strokeWidth={1.5} opacity={0.5} />
              )}
            </g>
          );
        })}

        {/* Rótulos do eixo X (datas) */}
        {dados.length <= 8 ? (
          dados.map((d, i) => (
            <text
              key={i}
              x={escalas.x(i)}
              y={SVG_H - 8}
              textAnchor="middle"
              className="text-[10px] fill-texto-secundario"
              style={{ fontSize: 10 }}
            >
              {formatarDataCurta(d.data)}
            </text>
          ))
        ) : (
          dados
            .filter((_, i) => i % Math.ceil(dados.length / 6) === 0 || i === dados.length - 1)
            .map((d, i) => {
              const realIdx = i === 0 ? 0 : Math.min(Math.ceil(dados.length / 6) * i, dados.length - 1);
              return (
                <text
                  key={realIdx}
                  x={escalas.x(realIdx)}
                  y={SVG_H - 8}
                  textAnchor={realIdx === 0 ? 'start' : realIdx === dados.length - 1 ? 'end' : 'middle'}
                  className="text-[10px] fill-texto-secundario"
                  style={{ fontSize: 10 }}
                >
                  {formatarDataCurta(d.data)}
                </text>
              );
            })
        )}

        {/* Label da unidade no topo do eixo Y */}
        {dados[0]?.unidade && (
          <text
            x={8}
            y={MARGEM.top + 4}
            className="text-[9px] fill-texto-secundario font-medium"
            style={{ fontSize: 9 }}
          >
            {dados[0].unidade}
          </text>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && dados[hoveredIdx] && (
        <div
          className="pointer-events-none absolute z-10 px-3 py-2 rounded-[var(--radius-md)] bg-fundo-card border border-borda shadow-xl text-xs transition-opacity"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: tooltipPos.x > SVG_W / 2 ? 'translateX(-100%)' : 'translateX(0)',
          }}
        >
          <p className="font-semibold text-texto">{dados[hoveredIdx]!.valorOriginal} {dados[hoveredIdx]!.unidade}</p>
          <p className="text-texto-secundario">{formatarData(dados[hoveredIdx]!.data)}</p>
          {dados[hoveredIdx]!.flag !== 'nao_informado' && (
            <p className="text-[10px] mt-0.5" style={{ color: corDaFlag(dados[hoveredIdx]!.flag).fill }}>
              {corDaFlag(dados[hoveredIdx]!.flag).label}
            </p>
          )}
        </div>
      )}

      {/* Dica para pontos insuficientes */}
      {dados.length === 1 && (
        <p className="text-xs text-texto-secundario text-center mt-2">
          Apenas 1 registro disponível. Adicione mais exames de <strong className="text-texto">{marcador}</strong> para ver a evolução.
        </p>
      )}
    </div>
  );
}
