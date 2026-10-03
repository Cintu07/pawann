// Pasted images survive a reload. localStorage cannot hold them, IndexedDB can.

export interface StoredImage {
  name: string;
  mime: string;
  bytes: ArrayBuffer;
}

const DB = "pawan-studio";
const STORE = "images";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "name" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const saveImage = (img: StoredImage) => run("readwrite", (s) => s.put(img)).catch(() => undefined);
export const removeImage = (name: string) => run("readwrite", (s) => s.delete(name)).catch(() => undefined);
export const clearImages = () => run("readwrite", (s) => s.clear()).catch(() => undefined);
export const loadImages = (): Promise<StoredImage[]> => run("readonly", (s) => s.getAll() as IDBRequest<StoredImage[]>).catch(() => []);
