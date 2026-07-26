import { Clock, Shield, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthProvider';
import { Botao } from '../../core/ui';

export function AguardandoAprovacao() {
  const { usuario, sair } = useAuth();

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-alerta-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-alerta-700/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        <div className="glass rounded-[var(--radius-xl)] p-8 space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-alerta-600/20 border border-alerta-500/30 mb-2">
            <Clock size={36} className="text-alerta-400" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-texto mb-2">
              Cadastro em Análise
            </h1>
            <p className="text-texto-secundario text-sm leading-relaxed">
              Seu cadastro foi enviado e está aguardando aprovação do administrador.
              Você receberá acesso assim que for aprovado.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
              <Mail size={16} className="text-salus-400 shrink-0" />
              <div className="text-sm text-texto-secundario">
                <span className="text-texto font-medium">{usuario?.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
              <Shield size={16} className="text-salus-400 shrink-0" />
              <p className="text-sm text-texto-secundario">
                Apenas o administrador pode liberar novos acessos.
              </p>
            </div>
          </div>

          <Botao
            variante="secundario"
            className="w-full"
            icone={<LogOut size={16} />}
            onClick={sair}
          >
            Sair
          </Botao>

          <p className="text-xs text-texto-secundario/60">
            O Salus organiza informações de saúde. Ele não diagnostica, não prescreve e não substitui médico ou veterinário.
          </p>
        </div>
      </div>
    </div>
  );
}
