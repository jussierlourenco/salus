import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, FileText, Trash2, Download, Users, Database, ExternalLink } from 'lucide-react';
import { Botao, Card } from '../../core/ui';
import { useAuth } from '../../core/auth/AuthProvider';
import { useConfiguracao } from '../../core/config/ConfigContext';
import { salvarConfigUsuario } from '../../core/config/configuracao';

const VERSAO_CONSENTIMENTO = 1;

function SecaoLGPD({ icon: Icone, titulo, children }: { icon: React.ElementType; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
      <Icone size={18} className="text-salus-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-texto">{titulo}</p>
        <div className="text-xs text-texto-secundario mt-1 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function ConsentimentoLGPD() {
  const { familiaId } = useAuth();
  const { config, refreshConfig } = useConfiguracao();
  const navigate = useNavigate();
  const [aceito, setAceito] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const handleAceitar = async () => {
    if (!familiaId || !aceito) return;
    setSalvando(true);
    try {
      await salvarConfigUsuario(familiaId, {
        ...config,
        consentimentos: { lgpd: true, disclaimer_clinico: true, dados_terceiros: true },
        versao_consentimento: VERSAO_CONSENTIMENTO,
        data_consentimento: new Date().toISOString(),
      });
      await refreshConfig();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[LGPD] Erro ao salvar consentimento:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-slide-up">
        <Card glass padding="lg" className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-salus-500 to-salus-800 shadow-lg mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-texto">Privacidade e Proteção de Dados</h2>
            <p className="text-texto-secundario mt-2 text-sm">
              O Salus trata dados pessoais e de saúde. Antes de continuar, leia e aceite os termos abaixo.
            </p>
          </div>

          <div className="space-y-3 max-h-[50dvh] overflow-y-auto pr-1">
            <SecaoLGPD icon={Database} titulo="1. Dados Coletados">
              Coletamos nome, email, foto do perfil (via login Google), dados de saúde cadastrados por você (exames,
              medicamentos, vacinas, eventos clínicos), e documentos enviados (PDFs, imagens, áudios) para processamento.
            </SecaoLGPD>

            <SecaoLGPD icon={Shield} titulo="2. Finalidade do Tratamento">
              Os dados são utilizados exclusivamente para organizar e exibir o histórico de saúde da sua família.
              Nenhum dado é vendido, compartilhado ou utilizado para publicidade.
            </SecaoLGPD>

            <SecaoLGPD icon={FileText} titulo="3. Base Legal">
              O tratamento de dados é realizado com base no seu consentimento (Art. 7º, I da LGPD) e, para dados de saúde,
              no Art. 11, II — consentimento específico e destacado.
            </SecaoLGPD>

            <SecaoLGPD icon={Users} titulo="4. Compartilhamento e Terceiros">
              Ao registrar dados de terceiros (familiares), você declara ter obtido o consentimento deles.
              Chaves de API de IA são armazenadas no Firestore criptografado em trânsito e só usadas nas chamadas ao
              provedor que você escolheu.
            </SecaoLGPD>

            <SecaoLGPD icon={Trash2} titulo="5. Exclusão e Retenção">
              Você pode exportar ou apagar todos os seus dados a qualquer momento em Ajustes → Privacidade.
              Ao apagar a conta, todos os dados sob seu UID são removidos permanentemente do Firestore.
            </SecaoLGPD>

            <SecaoLGPD icon={Download} titulo="6. Seus Direitos (LGPD Art. 18)">
              Você tem direito a: confirmar a existência de tratamento, acessar os dados, corrigir dados incompletos,
              anonimizar ou eliminar dados desnecessários, revogar o consentimento a qualquer momento.
            </SecaoLGPD>

            <SecaoLGPD icon={ExternalLink} titulo="7. Encarregado (DPO)">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato pelo email
              <span className="text-salus-400 ml-1">jussier.silva@gmail.com</span>.
            </SecaoLGPD>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda cursor-pointer">
            <input
              type="checkbox"
              checked={aceito}
              onChange={(e) => setAceito(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-[4px] border-2 border-borda bg-fundo-elevado
                         checked:bg-salus-500 checked:border-salus-500 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-salus-500/40"
            />
            <div>
              <p className="text-sm font-medium text-texto">
                Li e aceito a política de privacidade e proteção de dados
              </p>
              <p className="text-xs text-texto-secundario mt-0.5">
                Estou ciente dos meus direitos e da finalidade do tratamento dos meus dados pessoais e de saúde.
              </p>
            </div>
          </label>

          <Botao
            className="w-full"
            onClick={handleAceitar}
            disabled={!aceito || salvando}
            icone={salvando ? undefined : <Check size={18} />}
          >
            {salvando ? 'Salvando consentimento...' : 'Aceitar e Continuar'}
          </Botao>

          <p className="text-[11px] text-texto-secundario/60 text-center">
            O Salus organiza informações de saúde. Ele não diagnostica, não prescreve e não substitui médico ou veterinário.
          </p>
        </Card>
      </div>
    </div>
  );
}
