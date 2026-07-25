import { useState } from 'react';
import { Card, Botao, Campo } from '../../componentes/ui';
import {
  Settings, Key, Cloud, Download, Upload, Trash2,
  Shield, ChevronRight,
} from 'lucide-react';
import { exportarParaZip, baixarArquivo } from '../../servicos/exportImport';

const presets = [
  { id: 'gemini', nome: 'Google Gemini', gratis: true, desc: 'Recomendado · Melhor para PDFs e imagens' },
  { id: 'groq', nome: 'Groq', gratis: true, desc: 'Muito rápido · Bom para o Chat' },
  { id: 'openrouter', nome: 'OpenRouter', gratis: true, desc: 'Vários modelos gratuitos' },
  { id: 'mistral', nome: 'Mistral', gratis: true, desc: 'Camada "Experiment" gratuita' },
  { id: 'custom', nome: 'Personalizado', gratis: false, desc: 'Qualquer provedor compatível com OpenAI' },
];

export function Ajustes() {
  const [secaoAberta, setSecaoAberta] = useState<string | null>('ia');

  const toggleSecao = (id: string) => {
    setSecaoAberta(secaoAberta === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
          <Settings size={24} className="text-salus-500" />
          Ajustes
        </h1>
        <p className="text-texto-secundario mt-1">
          Configure IA, nuvem, exportação e privacidade.
        </p>
      </div>

      {/* IA Provider */}
      <Card>
        <button
          onClick={() => toggleSecao('ia')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-salus-600/15 flex items-center justify-center">
              <Key size={20} className="text-salus-400" />
            </div>
            <div>
              <h2 className="font-semibold text-texto">Provedor de IA</h2>
              <p className="text-xs text-texto-secundario">Opcional · Cadastre sua própria chave</p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'ia' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'ia' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-4">
            <p className="text-sm text-texto-secundario">
              O Salus funciona sem IA. Se quiser usar o Chat e a extração automática de documentos,
              cadastre sua chave de um dos provedores abaixo. Há opções gratuitas.
            </p>
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  className="flex items-center gap-3 w-full p-3 rounded-[var(--radius-md)]
                             border border-borda hover:border-salus-600/50 transition-all text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-texto">{preset.nome}</span>
                      {preset.gratis && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-salus-900/50 text-salus-400 font-medium">
                          Grátis
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-texto-secundario">{preset.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-texto-secundario" />
                </button>
              ))}
            </div>
            <Campo label="Chave da API" type="password" placeholder="Cole sua chave aqui" />
            <Botao tamanho="sm">Salvar chave</Botao>
          </div>
        )}
      </Card>

      {/* Google Drive */}
      <Card>
        <button
          onClick={() => toggleSecao('drive')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-alerta-600/15 flex items-center justify-center">
              <Cloud size={20} className="text-alerta-400" />
            </div>
            <div>
              <h2 className="font-semibold text-texto">Google Drive</h2>
              <p className="text-xs text-texto-secundario">Guardar documentos na sua nuvem</p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'drive' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'drive' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-3">
            <p className="text-sm text-texto-secundario">
              Conecte seu Google Drive para guardar PDFs, fotos e áudios de exames.
              O Salus cria uma pasta "Salus App" e só acessa os arquivos que ele mesmo criou.
            </p>
            <Botao variante="secundario" icone={<Cloud size={18} />}>
              Conectar Google Drive
            </Botao>
          </div>
        )}
      </Card>

      {/* Export/Import */}
      <Card>
        <button
          onClick={() => toggleSecao('dados')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-fundo-elevado flex items-center justify-center">
              <Download size={20} className="text-texto-secundario" />
            </div>
            <div>
              <h2 className="font-semibold text-texto">Exportar / Importar</h2>
              <p className="text-xs text-texto-secundario">Seus dados em formato Markdown</p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'dados' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'dados' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-3">
            <p className="text-sm text-texto-secundario">
              Exporte seus dados como um .zip com toda a árvore Markdown do Salus.
              Legível por humano, compatível com o framework original.
            </p>
            <div className="flex gap-2">
              <Botao
                variante="secundario"
                tamanho="sm"
                icone={<Download size={16} />}
                onClick={async () => {
                  try {
                    const blob = await exportarParaZip({
                      membros: [],
                      medicamentos: [],
                      exames: [],
                      vacinas: [],
                      eventos: [],
                    });
                    baixarArquivo(blob, `salus-export-${new Date().toISOString().split('T')[0]}.zip`);
                  } catch (e) {
                    alert('Erro ao exportar: ' + (e as Error).message);
                  }
                }}
              >
                Exportar .zip
              </Botao>
              <Botao variante="secundario" tamanho="sm" icone={<Upload size={16} />}>
                Importar .zip
              </Botao>
            </div>
          </div>
        )}
      </Card>

      {/* Privacy */}
      <Card>
        <button
          onClick={() => toggleSecao('privacidade')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-fundo-elevado flex items-center justify-center">
              <Shield size={20} className="text-texto-secundario" />
            </div>
            <div>
              <h2 className="font-semibold text-texto">Privacidade</h2>
              <p className="text-xs text-texto-secundario">Onde seus dados ficam e como apagar</p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'privacidade' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'privacidade' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-4">
            <div className="text-sm text-texto-secundario space-y-2">
              <p>• Dados estruturados ficam no banco do Salus, protegidos por login.</p>
              <p>• Documentos originais ficam no seu Google Drive, numa pasta que só o Salus acessa.</p>
              <p>• O mantenedor do app não vê nem armazena seus documentos originais.</p>
              <p>• Quando a IA processa um documento, ele é enviado ao provedor de IA que <strong>você</strong> escolheu, com <strong>sua</strong> chave.</p>
            </div>
            <div className="pt-3 border-t border-borda">
              <Botao variante="perigo" tamanho="sm" icone={<Trash2 size={16} />}>
                Apagar minha conta e dados
              </Botao>
              <p className="text-xs text-texto-secundario mt-2">
                Antes de apagar, você poderá exportar todos os seus dados.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
