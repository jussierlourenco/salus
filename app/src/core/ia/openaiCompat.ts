import type { ProvedorIA, MensagemChat, RespostaChat } from './interface';
import type { PropostaExtracao } from '../../types/dominio';
import { validarPropostaIA } from './validacao';

export class ProvedorOpenAICompat implements ProvedorIA {
  private chave: string;
  private modelo: string;
  private urlBase: string;

  capacidades = {
    imagem: true,
    pdf: false,
    audio: false,
  };

  constructor(chave: string, modelo = 'gpt-4o-mini', urlBase = 'https://api.openai.com/v1') {
    this.chave = chave;
    this.modelo = modelo;
    this.urlBase = urlBase.replace(/\/$/, '');
  }

  async extrairDocumento(
    _arquivo: ArrayBuffer,
    _mimeType: string,
    nomeArquivo: string,
    contexto: string,
  ): Promise<PropostaExtracao> {
    const url = `${this.urlBase}/chat/completions`;

    const systemPrompt = `Você é o assistente clínico Salus. Analise o contexto do documento "${nomeArquivo}".
Contexto: ${contexto}

Retorne um JSON com a estrutura PropostaExtracao (medicamentos, exames, vacinas, eventos, notas, markdown_gerado).`;

    const payload = {
      model: this.modelo,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Documento a processar: ${nomeArquivo}` },
      ],
      response_format: { type: 'json_object' },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.chave}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro na API OpenAI (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const texto = data.choices?.[0]?.message?.content ?? '{}';

    return validarPropostaIA(texto);
  }

  async chat(mensagens: MensagemChat[], contexto: string): Promise<RespostaChat> {
    const url = `${this.urlBase}/chat/completions`;

    const systemPrompt = `Você é o assistente Salus de saúde da família.
Contexto da família:
${contexto}
Responda em português de forma clara, empática e responsável. O Salus não substitui consulta médica.`;

    const payload = {
      model: this.modelo,
      messages: [
        { role: 'system', content: systemPrompt },
        ...mensagens.map((m) => ({
          role: m.papel === 'usuario' ? 'user' : 'assistant',
          content: m.conteudo,
        })),
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.chave}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro na API OpenAI (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const conteudo = data.choices?.[0]?.message?.content ?? '';
    return { conteudo };
  }
}
