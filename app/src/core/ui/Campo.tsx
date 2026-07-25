import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';

interface CampoBaseProps {
  label: string;
  erro?: string;
  dica?: string;
  icone?: ReactNode;
}

type CampoInputProps = CampoBaseProps & InputHTMLAttributes<HTMLInputElement> & { tipo?: 'input' };
type CampoTextareaProps = CampoBaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { tipo: 'textarea' };

type CampoProps = CampoInputProps | CampoTextareaProps;

export const Campo = forwardRef<HTMLInputElement | HTMLTextAreaElement, CampoProps>(
  function Campo({ label, erro, dica, icone, tipo, className = '', ...rest }, ref) {
    const id = rest.id ?? label.toLowerCase().replace(/\s+/g, '-');
    const isTextarea = tipo === 'textarea';

    const classes = `
      w-full bg-fundo-elevado/50 border rounded-[var(--radius-md)]
      px-3 py-2.5 text-texto placeholder:text-texto-secundario/50
      transition-colors duration-200
      focus:border-salus-500 focus:ring-1 focus:ring-salus-500/30
      ${erro ? 'border-vencido-500' : 'border-borda'}
      ${icone ? 'pl-10' : ''}
      ${className}
    `;

    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-texto-secundario">
          {label}
        </label>
        <div className="relative">
          {icone && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-secundario">
              {icone}
            </span>
          )}
          {isTextarea ? (
            <textarea
              id={id}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              className={`${classes} min-h-[100px] resize-y`}
              {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              id={id}
              ref={ref as React.Ref<HTMLInputElement>}
              className={classes}
              {...(rest as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
        </div>
        {erro && <p className="text-sm text-vencido-500">{erro}</p>}
        {dica && !erro && <p className="text-xs text-texto-secundario">{dica}</p>}
      </div>
    );
  }
);
