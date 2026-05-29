const DB_NAME = "music-player-cache";
const DB_VERSION = 2;

interface StoreSchema {
  name: string;
  keyPath: string;
  indexes?: Array<{ name: string; keyPath: string; unique?: boolean }>;
}

const STORES: StoreSchema[] = [
  { name: "song_metadata", keyPath: "id", indexes: [{ name: "cachedAt", keyPath: "cachedAt" }] },
  { name: "offline_playlists", keyPath: "id", indexes: [{ name: "cachedAt", keyPath: "cachedAt" }] },
  {
    name: "play_history_local",
    keyPath: "id",
    indexes: [
      { name: "songId", keyPath: "songId" },
      { name: "playedAt", keyPath: "playedAt" },
    ],
  },
  { name: "lyric_cache", keyPath: "songId" },
  { name: "image_cache_meta", keyPath: "url" },
  { name: "audio_blobs", keyPath: "songId", indexes: [{ name: "cachedAt", keyPath: "cachedAt" }] },
  { name: "image_blobs", keyPath: "url" },
  { name: "offline_songs", keyPath: "songId" },
];

// ==================== Singleton ====================

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const schema of STORES) {
        if (!db.objectStoreNames.contains(schema.name)) {
          const store = db.createObjectStore(schema.name, { keyPath: schema.keyPath });
          for (const idx of schema.indexes ?? []) {
            store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
          }
        }
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => {
        dbInstance = null;
        dbPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// ==================== Generic CRUD ====================

export async function getItem<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(storeName)) return undefined;

  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function putItem<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteItem(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(storeName)) return;

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(storeName)) return [];

  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: string,
): Promise<T[]> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(storeName)) return [];

  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function countItems(storeName: string): Promise<number> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(storeName)) return 0;

  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(storeName)) return;

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
