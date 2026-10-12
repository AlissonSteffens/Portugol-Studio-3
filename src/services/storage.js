let database;
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('portugol-studio', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('files', { keyPath: 'path' });
      request.result.createObjectStore('document-files', { keyPath: 'id' });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); database = undefined; };
      resolve(db);
    };
    request.onerror = () => { database = undefined; reject(new Error('Não foi possível abrir o armazenamento do navegador.', { cause: request.error })); };
    request.onblocked = () => { database = undefined; reject(new Error('Feche as outras abas do Portugol Studio para atualizar o armazenamento.')); };
  });
  return database;
}

export async function storedOperation(store, mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = operation(transaction.objectStore(store));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(new Error('Não foi possível acessar os arquivos locais. Confira o espaço disponível no navegador.', { cause: transaction.error }));
    transaction.onerror = () => {}; // O abort da transação entrega o erro ao chamador.
  });
}

export const documentFiles = {
  async read(id) { return (await storedOperation('document-files', 'readonly', store => store.get(id)))?.files || {}; },
  async write(id, files) { await storedOperation('document-files', 'readwrite', store => store.put({ id, files })); },
  async remove(id) { await storedOperation('document-files', 'readwrite', store => store.delete(id)); },
};
