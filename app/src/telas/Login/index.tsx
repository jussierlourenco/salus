import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import { Botao } from '../../componentes/ui';
import { Stethoscope, Shield, Smartphone, Cloud } from 'lucide-react';
import { useEffect } from 'react';

export function Login() {
  const { usuario, entrar, carregando } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario) navigate('/', { replace: true });
  }, [usuario, navigate]);

  if (carregando) return null;

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-salus-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-salus-700/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-salus-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-salus-500 to-salus-800 shadow-2xl shadow-salus-600/30 mb-5">
            <Stethoscope size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-texto mb-2">Salus</h1>
          <p className="text-texto-secundario text-lg">Central de Saúde da Família</p>
        </div>

        {/* Card */}
        <div className="glass rounded-[var(--radius-xl)] p-8 space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-texto mb-2">Bem-vindo</h2>
            <p className="text-sm text-texto-secundario">
              Organize exames, receitas e o histórico de saúde de toda a sua família — pessoas e animais.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { icone: Shield, texto: 'Seus dados isolados e protegidos por login' },
              { icone: Cloud, texto: 'Documentos guardados na sua nuvem' },
              { icone: Smartphone, texto: 'Funciona no celular, tablet e computador' },
            ].map(({ icone: Icone, texto }) => (
              <div key={texto} className="flex items-center gap-3 text-sm">
                <div className="shrink-0 w-8 h-8 rounded-[var(--radius-sm)] bg-salus-600/10 flex items-center justify-center">
                  <Icone size={16} className="text-salus-400" />
                </div>
                <span className="text-texto-secundario">{texto}</span>
              </div>
            ))}
          </div>

          {/* Login Button */}
          <Botao
            onClick={entrar}
            tamanho="lg"
            className="w-full"
            icone={
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            }
          >
            Entrar com Google
          </Botao>

          <p className="text-[11px] text-texto-secundario/60 text-center leading-relaxed">
            O Salus organiza informações de saúde. Ele não diagnostica, não prescreve e não substitui médico ou veterinário.
          </p>
        </div>
      </div>
    </div>
  );
}
