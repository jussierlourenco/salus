const FOLDER_NAME = 'Salus App';

export interface DriveFileResult {
  id: string;
  name: string;
  webViewLink?: string;
}

export class ServicoGoogleDrive {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetchApi(url: string, options: RequestInit = {}) {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Drive API error (${res.status}): ${err}`);
    }
    return res;
  }

  async obterOuCriarPastaRaiz(): Promise<string> {
    const q = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const res = await this.fetchApi(`https://www.googleapis.com/drive/v3/files?q=${q}`);
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    const createRes = await this.fetchApi('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    const folderData = await createRes.json();
    return folderData.id;
  }

  async enviarArquivo(
    arquivo: Blob | File,
    nomeArquivo: string,
    _mimeType: string,
    pastaId?: string
  ): Promise<DriveFileResult> {
    const folderId = pastaId ?? (await this.obterOuCriarPastaRaiz());

    const metadata = {
      name: nomeArquivo,
      parents: [folderId],
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', arquivo, nomeArquivo);

    const res = await this.fetchApi(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        body: formData,
      }
    );

    return (await res.json()) as DriveFileResult;
  }
}
