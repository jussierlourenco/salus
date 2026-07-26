/**
 * Autorização do Google Drive via Google Identity Services (GIS), inteiramente no navegador.
 * O app é 100% client-side (sem servidor próprio) — por isso não há troca de código por
 * `refresh_token` no back-end, como planejado originalmente em 00_ARQUITETURA.md §4.
 * Em vez disso, cada sessão obtém um access token de curta duração (~1h) diretamente do
 * Google, mantido só em memória (nunca em localStorage/Firestore), com renovação silenciosa
 * via `prompt: ''` enquanto a pessoa continuar com sessão ativa no Google naquele navegador.
 */

const ESCOPO_DRIVE = 'https://www.googleapis.com/auth/drive.file';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

interface RespostaToken {
  access_token: string;
  expires_in: number;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (opcoes?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resposta: RespostaToken) => void;
          }) => TokenClient;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

let accessTokenAtual: string | null = null;
let expiraEmMs = 0;
let scriptCarregado: Promise<void> | null = null;

function carregarScriptGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptCarregado) return scriptCarregado;

  scriptCarregado = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Não foi possível carregar o script de autenticação do Google.'));
    document.head.appendChild(script);
  });
  return scriptCarregado;
}

export function driveConfigurado(): boolean {
  return Boolean(CLIENT_ID);
}

export function obterAccessTokenValido(): string | null {
  if (accessTokenAtual && Date.now() < expiraEmMs) return accessTokenAtual;
  return null;
}

function solicitarToken(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = window.google;
    if (!google) {
      reject(new Error('Script do Google não carregado.'));
      return;
    }
    const cliente = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: ESCOPO_DRIVE,
      callback: (resposta) => {
        if (resposta.error || !resposta.access_token) {
          reject(new Error(resposta.error || 'O Google não retornou um token de acesso.'));
          return;
        }
        accessTokenAtual = resposta.access_token;
        expiraEmMs = Date.now() + (resposta.expires_in - 60) * 1000;
        resolve(resposta.access_token);
      },
    });
    cliente.requestAccessToken({ prompt });
  });
}

/** Abre o consentimento do Google (popup) — usar no clique de "Conectar Google Drive". */
export async function conectarGoogleDrive(): Promise<string> {
  if (!CLIENT_ID) {
    throw new Error(
      'A integração com Google Drive não está configurada neste app (falta a variável VITE_GOOGLE_CLIENT_ID). Veja app/CONFIGURACAO.md.'
    );
  }
  await carregarScriptGis();
  return solicitarToken('consent');
}

/** Tenta renovar o token sem popup — usado ao carregar o app se `drive_conectado` já era true. */
export async function renovarTokenSilenciosamente(): Promise<string | null> {
  if (!CLIENT_ID) return null;
  try {
    await carregarScriptGis();
    return await solicitarToken('');
  } catch {
    return null;
  }
}

export function desconectarGoogleDrive(): void {
  const token = accessTokenAtual;
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
  accessTokenAtual = null;
  expiraEmMs = 0;
}
