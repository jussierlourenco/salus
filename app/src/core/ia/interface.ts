import type { PropostaExtracao, ConfigProvedorIA } from '../../types/dominio';

export interface MensagemChat {
  papel: 'usuario' | 'assistente' | 'sistema';
  conteudo: string;
}

export interface RespostaChat {
  conteudo: string;
  proposta?: PropostaExtracao;
}

export interface ProvedorIA {
  extrairDocumento(
    arquivo: ArrayBuffer,
    mimeType: string,
    nomeArquivo: string,
    contexto: string,
  ): Promise<PropostaExtracao>;

  chat(
    mensagens: MensagemChat[],
    contexto: string,
  ): Promise<RespostaChat>;

  capacidades: {
    imagem: boolean;
    pdf: boolean;
    audio: boolean;
  };
}

import { ProvedorGemini } from './gemini';
import { ProvedorOpenAICompat } from './openaiCompat';

export function criarProvedor(config?: ConfigProvedorIA): ProvedorIA {
  if (!config || !config.chave) {
    return {
      capacidades: { imagem: true, pdf: true, audio: false },
      async extrairDocumento() {
        return {
          notas: 'Provedor de IA não configurado. Configure uma chave em Ajustes.',
          markdown_gerado: '<!-- Configure um provedor em Ajustes -->',
        };
      },
      async chat() {
        return {
          conteudo: 'Para conversar com o Salus, configure uma chave de IA em Ajustes. Há opções gratuitas (Gemini, Groq, OpenRouter).',
        };
      },
    };
  }

  if (config.tipo === 'gemini') {
    return new ProvedorGemini(config.chave, config.modelo || 'gemini-2.5-flash');
  }

  return new ProvedorOpenAICompat(config.chave, config.modelo, config.url_base);
}
