export interface PerguntaFaq {
  pergunta: string;
  resposta: string;
}

export interface CategoriaFaq {
  categoria: string;
  perguntas: PerguntaFaq[];
}

/** Curadoria do docs/FAQ.md focada no Salus App (web) — omite as partes que só valem para a versão framework. */
export const FAQ_LOGIN: CategoriaFaq[] = [
  {
    categoria: 'Sobre o Salus',
    perguntas: [
      {
        pergunta: 'O que é o Salus?',
        resposta:
          'Uma central de saúde para a família inteira — pessoas, cães e gatos. Ele organiza exames, medicamentos, vacinas, consultas e documentos originais (PDFs, fotos, áudios) em um só lugar, e permite conversar em linguagem natural sobre esse histórico.',
      },
      {
        pergunta: 'O Salus faz diagnóstico médico?',
        resposta:
          'Não. O Salus organiza, arquiva e cruza informações de saúde. Ele não diagnostica, não prescreve e não substitui a avaliação de um médico ou veterinário. Sempre que algo parecer alterado, o app sugere mostrar a um profissional.',
      },
    ],
  },
  {
    categoria: 'Contas e acesso',
    perguntas: [
      {
        pergunta: 'Como eu entro no app?',
        resposta: 'Login com conta Google, nesta mesma tela. Não existe cadastro por e-mail/senha separado.',
      },
      {
        pergunta: 'Fiz login mas caí em uma tela "Aguardando aprovação" — o que é isso?',
        resposta:
          'Contas novas nascem com status pendente. Um administrador precisa aprovar o seu acesso antes de você poder usar o app. Isso existe porque o Salus é multi-tenant e o dono da instância controla quem entra.',
      },
      {
        pergunta: 'Depois de aprovado, o que acontece?',
        resposta:
          'Você passa por um consentimento LGPD e depois pelo onboarding: cadastro dos membros da família (pessoas e pets), parentesco e vínculo biológico/adotivo.',
      },
      {
        pergunta: 'Posso compartilhar o perfil de um membro específico com outra pessoa, sem dar acesso à família toda?',
        resposta:
          'Sim. Cada membro tem sua própria lista de pessoas com quem foi compartilhado. Quem está nessa lista lê/escreve medicamentos, exames, vacinas e eventos daquele membro, sem ver o resto da família.',
      },
    ],
  },
  {
    categoria: 'Dados, privacidade e segurança',
    perguntas: [
      {
        pergunta: 'Onde ficam guardados meus dados?',
        resposta:
          'Dados clínicos estruturados (membros, medicamentos, exames, vacinas, eventos) ficam isolados por família em nuvem segura. Os arquivos originais (PDF, foto, áudio) nunca ficam em um servidor do mantenedor — ficam no Google Drive do próprio usuário, numa pasta "Salus App" que o app cria com o escopo mais restrito possível: ele só enxerga os arquivos que ele mesmo criou.',
      },
      {
        pergunta: 'O app guarda meu token do Google Drive?',
        resposta:
          'Não de forma persistente. O token de acesso dura cerca de 1 hora e fica só em memória durante a sessão. Ao recarregar a página, o app tenta renovar silenciosamente; se não conseguir, pede para reconectar.',
      },
      {
        pergunta: 'Toda saída da IA vira gravação automática no meu histórico?',
        resposta:
          'Não. O princípio do produto é que nenhuma gravação de IA é direta: toda proposta passa por uma tela de confirmação (valor atual → valor novo, com Confirmar/Editar/Descartar) antes de tocar o banco.',
      },
    ],
  },
  {
    categoria: 'IA e chave de API (BYOK)',
    perguntas: [
      {
        pergunta: 'Preciso pagar para usar o Salus?',
        resposta:
          'O app em si é gratuito. A parte que pode ter custo é a IA (extração de documentos e Chat), e você usa a sua própria chave de um provedor (BYOK — Bring Your Own Key). Todos os provedores suportados têm camada gratuita.',
      },
      {
        pergunta: 'Quais provedores de IA são suportados?',
        resposta:
          'Google Gemini (recomendado, com suporte a imagem e PDF), Groq (rápido, bom para o Chat), OpenRouter (vários modelos gratuitos) e Mistral. Qualquer outro provedor compatível com a API "Chat Completions" da OpenAI também funciona.',
      },
      {
        pergunta: 'Onde eu cadastro minha chave?',
        resposta: 'Em Ajustes → Provedor de IA. Cole a chave e clique em "Testar Conexão" antes de salvar.',
      },
      {
        pergunta: 'E se eu não quiser cadastrar chave nenhuma?',
        resposta:
          'O app funciona normalmente pelo caminho manual — você digita tudo. Só ficam indisponíveis o Chat e a extração automática de documentos na Caixa de Entrada.',
      },
    ],
  },
  {
    categoria: 'Documentos e Caixa de Entrada',
    perguntas: [
      {
        pergunta: 'Como eu adiciono um exame, receita ou laudo novo?',
        resposta:
          'Vá em Caixa de Entrada e envie o arquivo (PDF, foto ou áudio). Com uma chave de IA configurada, o app tenta extrair automaticamente medicamentos, exames, vacinas ou eventos e monta uma proposta para você revisar e confirmar antes de gravar.',
      },
      {
        pergunta: 'A extração automática é confiável?',
        resposta:
          'Trate como um rascunho, não como verdade absoluta — sempre revise a proposta antes de confirmar, especialmente valores de exames e datas.',
      },
      {
        pergunta: 'Um medicamento encontrado numa receita já entra como "Em uso"?',
        resposta:
          'Não automaticamente. Ele entra como "Prescrito" e só muda para "Em uso" depois que você confirma que comprou/está tomando.',
      },
    ],
  },
  {
    categoria: 'Uso do dia a dia',
    perguntas: [
      {
        pergunta: 'O que é o Diário, na Ficha de cada membro?',
        resposta:
          'Uma aba dentro do Perfil do membro para registrar rapidamente sintomas, medicações tomadas, medições (pressão, peso etc.), vacinas ou notas de consulta, organizados por dia num calendário e numa linha do tempo.',
      },
      {
        pergunta: 'Como vejo o que está vencendo (vacina, receita, check-up)?',
        resposta:
          'No Painel, a tela inicial mostra o raio-x da família: o que já venceu, o que vence em 30 dias e o que vence em 31–90 dias. Esse cálculo é local e não depende de IA.',
      },
      {
        pergunta: 'Posso exportar meus dados para sair do app sem perder nada?',
        resposta: 'Sim. Em Ajustes há exportação/importação em .zip, pensado deliberadamente para evitar vendor lock-in.',
      },
      {
        pergunta: 'O app funciona offline ou no celular?',
        resposta:
          'É um PWA (instalável), mas depende de internet para ler/gravar dados — não há um modo totalmente offline com sincronização posterior.',
      },
    ],
  },
  {
    categoria: 'Problemas comuns',
    perguntas: [
      {
        pergunta: 'Cliquei em "Conectar Google Drive" e nada acontece / aparece um aviso.',
        resposta:
          'Provavelmente esta instância do app não tem a integração com Drive configurada. Sem isso, a integração fica desabilitada — o resto do app continua funcionando normalmente.',
      },
      {
        pergunta: 'O Google mostra um aviso "app não verificado" ao conectar o Drive.',
        resposta:
          'Normal enquanto a instância está em modo de teste no Google Cloud Console — só quem foi adicionado como "usuário de teste" consegue prosseguir.',
      },
      {
        pergunta: 'Encontrei um bug ou quero sugerir algo — para onde vai?',
        resposta: 'Fale com quem administra a sua instância do Salus.',
      },
    ],
  },
];
