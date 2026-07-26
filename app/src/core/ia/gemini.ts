import type { ProvedorIA, MensagemChat, RespostaChat } from './interface';
import type { PropostaExtracao } from '../../types/dominio';
import { validarPropostaIA } from './validacao';

export class ProvedorGemini implements ProvedorIA {
  private chave: string;
  private modelo: string;

  capacidades = {
    imagem: true,
    pdf: true,
    audio: true,
  };

  constructor(chave: string, modelo = 'gemini-2.5-flash') {
    this.chave = chave;
    this.modelo = modelo;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private formatarNomeModelo(mod: string): string {
    let m = (mod || 'gemini-2.5-flash').trim();
    if (m.startsWith('models/')) {
      m = m.replace(/^models\//, '');
    }
    return m;
  }

  private obterListaModelosCandidatos(modeloInicial: string): string[] {
    const limpo = this.formatarNomeModelo(modeloInicial);
    const candidatos = [limpo, 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite'];
    return Array.from(new Set(candidatos));
  }

  private async requisitarComFallback(
    payload: unknown,
    origem: string
  ): Promise<any> {
    const modelosParaTestar = this.obterListaModelosCandidatos(this.modelo);
    let ultimoErro: Error | null = null;
    let tevelimiteExcedido = false;

    for (const mod of modelosParaTestar) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${this.chave}`;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          return await res.json();
        }

        const errText = await res.text();

        if (res.status === 429) {
          tevelimiteExcedido = true;
        }

        if ((res.status === 404 || res.status === 429) && mod !== modelosParaTestar[modelosParaTestar.length - 1]) {
          console.warn(`[Gemini] Modelo ${mod} retornou HTTP ${res.status}. Tentando próximo candidato...`);
          ultimoErro = new Error(`Erro no ${origem} (${res.status}): ${errText}`);
          continue;
        }

        if (res.status === 429) {
          throw new Error('Cota temporariamente excedida no Google Gemini (HTTP 429). Por favor, aguarde alguns segundos ou altere para outro provedor gratuito em Ajustes (ex: Groq ou OpenRouter).');
        }

        throw new Error(`Erro no ${origem} (${res.status}): ${errText}`);
      } catch (err) {
        ultimoErro = err instanceof Error ? err : new Error(String(err));
        if (err instanceof Error && (err.message.includes('404') || err.message.includes('429')) && mod !== modelosParaTestar[modelosParaTestar.length - 1]) {
          continue;
        }
        throw err;
      }
    }

    if (tevelimiteExcedido) {
      throw new Error('Cota temporariamente excedida no Google Gemini (HTTP 429). Por favor, aguarde cerca de 45 segundos ou altere para outro provedor em Ajustes (ex: Groq ou OpenRouter).');
    }

    throw ultimoErro || new Error(`Erro no ${origem}: Nenhum modelo Gemini respondeu.`);
  }

  async extrairDocumento(
    arquivo: ArrayBuffer,
    mimeType: string,
    nomeArquivo: string,
    contexto: string,
  ): Promise<PropostaExtracao> {
    const base64Data = this.arrayBufferToBase64(arquivo);
    const promptSystem = `Você é o assistente clínico do Salus. Analise o documento "${nomeArquivo}".
Contexto da família: ${contexto}

Você deve extrair informações clínicas e retornar EXATAMENTE um JSON no seguinte formato:
{
  "tipo_documento": "exame" | "receita" | "vacina" | "laudo" | "outro",
  "membro_id": "string se identificável no contexto",
  "medicamentos": [
    { "nome": "string", "dose": "string", "frequencia": "string", "motivo": "string" }
  ],
  "exames": [
    { "marcador": "string", "valor": "string", "unidade": "string", "flag": "normal" | "alto" | "baixo" }
  ],
  "vacinas": [
    { "nome": "string", "aplicada_em": "YYYY-MM-DD", "proxima_em": "YYYY-MM-DD" }
  ],
  "eventos": [
    { "tipo": "string", "descricao": "string", "data": "YYYY-MM-DD" }
  ],
  "notas": "Resumo clínico das descobertas",
  "markdown_gerado": "Markdown formatado com os dados para salvar na ficha"
}
Retorne APENAS o JSON válido sem blocos de código adicionais fora de json.`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptSystem },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
      },
    };

    const data = await this.requisitarComFallback(payload, 'Extrator Gemini');
    const textoResposta = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    return validarPropostaIA(textoResposta);
  }

  async chat(mensagens: MensagemChat[], contexto: string): Promise<RespostaChat> {
    const systemInstruction = `Você é o assistente Salus de saúde da família especializado em analisar dados clínicos registrados.
Contexto atual da família (dados do Firestore):
${contexto}

DIRETRIZES:
- Use os dados clínicos ACIMA (medicamentos, exames, vacinas, eventos, alergias) para dar análises honestas.
- Se um exame tem flag "alto" ou "baixo", explique de forma leiga o que significa mas SEMPRE recomende consultar um médico para interpretação definitiva.
- Se perguntarem sobre alergias, liste as alergias registradas e o que está disponível nos dados.
- Relacione dados: se um medicamento foi prescrito e um exame tem alteração, aponte a possível conexão de forma educativa.
- Seja PROATIVO: ao notar exames alterados ou medicamentos relevantes, mencione-os na resposta.
- Responda em português claro, empático e acessível.

LIMITES (OBRIGATÓRIO):
- NUNCA prescreva, diagnostique, altere doses ou sugira mudanças de tratamento.
- Sempre que citar um dado clínico, adicione "consulte seu médico para interpretação adequada".
- Se não houver dados para responder, diga honestamente o que está disponível e sugira cadastrar mais informações.`;

    const contents = mensagens.map((m) => ({
      role: m.papel === 'usuario' ? 'user' : 'model',
      parts: [{ text: m.conteudo }],
    }));

    const payload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
    };

    const data = await this.requisitarComFallback(payload, 'Chat Gemini');
    const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return { conteudo: resposta };
  }
}
