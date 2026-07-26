/**
 * Armazenamento local de arquivos originais via IndexedDB.
 * Cada usuário autenticado tem seu próprio banco isolado (`salus_arquivos_<uid>`).
 *
 * Os dados estruturados (medicamentos, exames etc.) continuam no Firestore.
 * Aqui vão só os arquivos binários originais (PDFs, fotos, áudios).
 * Se o navegador limpar o cache, os arquivos se perdem — por isso o app
 * oferece também download manual e, futuramente, Drive como backup opcional.
 */

const DB_VERSION = 1;

function abrirBanco(uid: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(`salus_arquivos_${uid}`, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('arquivos')) {
        const store = db.createObjectStore('arquivos', { keyPath: 'id' });
        store.createIndex('nome', 'nome', { unique: false });
        store.createIndex('criado_em', 'criado_em', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error('Falha ao abrir banco local: ' + req.error?.message));
  });
}

interface RegistroArquivo {
  id: string;
  nome: string;
  mime: string;
  tamanho: number;
  dados: ArrayBuffer;
  criado_em: string;
}

/** Salva um arquivo no banco local vinculado ao usuário. */
export async function salvarArquivoLocal(
  uid: string,
  id: string,
  arquivo: File
): Promise<void> {
  const db = await abrirBanco(uid);
  const dados = await arquivo.arrayBuffer();
  const registro: RegistroArquivo = {
    id,
    nome: arquivo.name,
    mime: arquivo.type,
    tamanho: arquivo.size,
    dados,
    criado_em: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('arquivos', 'readwrite');
    const store = tx.objectStore('arquivos');
    const req = store.put(registro);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error('Falha ao salvar arquivo local: ' + req.error?.message));
  });
}

/** Busca um arquivo salvo pelo ID. */
export async function obterArquivoLocal(
  uid: string,
  id: string
): Promise<{ arquivo: File; registro: Omit<RegistroArquivo, 'dados'> } | null> {
  const db = await abrirBanco(uid);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('arquivos', 'readonly');
    const store = tx.objectStore('arquivos');
    const req = store.get(id);

    req.onsuccess = () => {
      const reg = req.result as RegistroArquivo | undefined;
      if (!reg) { resolve(null); return; }
      const arquivo = new File([reg.dados], reg.nome, { type: reg.mime });
      resolve({
        arquivo,
        registro: { id: reg.id, nome: reg.nome, mime: reg.mime, tamanho: reg.tamanho, criado_em: reg.criado_em },
      });
    };
    req.onerror = () => reject(new Error('Falha ao buscar arquivo local: ' + req.error?.message));
  });
}

/** Lista metadados de todos os arquivos salvos (sem os binários). */
export async function listarArquivosLocais(
  uid: string
): Promise<Omit<RegistroArquivo, 'dados'>[]> {
  const db = await abrirBanco(uid);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('arquivos', 'readonly');
    const store = tx.objectStore('arquivos');
    const req = store.getAll();

    req.onsuccess = () => {
      const todos = (req.result as RegistroArquivo[]).map((r) => ({
        id: r.id,
        nome: r.nome,
        mime: r.mime,
        tamanho: r.tamanho,
        criado_em: r.criado_em,
      }));
      resolve(todos);
    };
    req.onerror = () => reject(new Error('Falha ao listar arquivos locais: ' + req.error?.message));
  });
}

/** Remove um arquivo do banco local. */
export async function removerArquivoLocal(uid: string, id: string): Promise<void> {
  const db = await abrirBanco(uid);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('arquivos', 'readwrite');
    const store = tx.objectStore('arquivos');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error('Falha ao remover arquivo local: ' + req.error?.message));
  });
}

/** Elimina todo o banco IndexedDB de um usuário (usado em "apagar conta"). */
export async function apagarBancoLocal(uid: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(`salus_arquivos_${uid}`);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error('Falha ao apagar banco local: ' + req.error?.message));
  });
}
