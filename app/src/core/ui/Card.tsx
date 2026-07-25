import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glass?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddings = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  hover = false,
  glass = false,
  padding = 'md',
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`
        rounded-[var(--radius-lg)] border border-borda
        ${glass ? 'glass' : 'bg-fundo-card'}
        ${paddings[padding]}
        ${hover ? 'transition-all duration-200 hover:border-salus-600/50 hover:shadow-lg hover:shadow-salus-600/5 hover:-translate-y-0.5' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
