import { openDB } from 'idb';
import { Annotation, Data, Settings } from '../models';

const DB_NAME = 'LabelEditorDB';
const DATA_STORE = 'dataStore';
const ANNOTATION_STORE = 'annotationStore';
const SETTINGS_STORE = 'settingsStore';

export type StoredAnnotation = {
  leRowId: number;
  annotation: Annotation;
};

export const initDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE, { keyPath: 'leRowId', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(ANNOTATION_STORE)) {
        db.createObjectStore(ANNOTATION_STORE, { keyPath: 'leRowId' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'leRowId', autoIncrement: true });
      }
    },
  });
};

/** Save data to IndexedDB */
export const saveData = async (data: any[]) => {
  const db = await initDB();
  const tx = db.transaction(DATA_STORE, 'readwrite');
  await Promise.all([...data.map((d) => tx.store.add(d)), tx.done]);
  // const store = tx.objectStore(DATA_STORE);
  // await store.put({ id: 1, rows: data });
  // await tx.done;
};

// Fetch data from IndexedDB
export const fetchData = async (fromKey = 1, count = 100): Promise<Data[]> => {
  const db = await initDB();
  const store = db.transaction(DATA_STORE).objectStore(DATA_STORE);
  return (await store.getAll(IDBKeyRange.bound(fromKey, fromKey + count - 1))) || [];
};

export const getDataCount = async () => {
  const db = await initDB();
  const store = db.transaction(DATA_STORE).objectStore(DATA_STORE);
  return await store.count();
};

// Save annotation to IndexedDB
export const saveAnnotation = async (leRowId: number, annotation: Annotation) => {
  const db = await initDB();
  const tx = db.transaction(ANNOTATION_STORE, 'readwrite');
  const store = tx.objectStore(ANNOTATION_STORE);
  await store.put({ leRowId, annotation } as StoredAnnotation);
  await tx.done;
};

// Fetch annotations
export const fetchAnnotations = async (fromKey = 1, count = 100): Promise<StoredAnnotation[]> => {
  const db = await initDB();
  const tx = db.transaction(ANNOTATION_STORE, 'readonly');
  const store = tx.objectStore(ANNOTATION_STORE);
  return (await store.getAll(IDBKeyRange.bound(fromKey, fromKey + count - 1))) as StoredAnnotation[];
};

export const getAnnotationCount = async () => {
  const db = await initDB();
  const store = db.transaction(ANNOTATION_STORE).objectStore(ANNOTATION_STORE);
  const keys = await store.getAllKeys();
  return keys && keys.length > 0 ? (keys[keys.length - 1] as number) : undefined;
};

export const saveSettings = async (settings: Settings) => {
  const db = await initDB();
  const tx = db.transaction(SETTINGS_STORE, 'readwrite');
  const store = tx.objectStore(SETTINGS_STORE);
  await store.put({ leRowId: 1, settings });
  await tx.done;
};

export const fetchSettings = async (): Promise<Settings> => {
  const db = await initDB();
  const tx = db.transaction(SETTINGS_STORE, 'readonly');
  const store = tx.objectStore(SETTINGS_STORE);
  return ((await store.get(1))?.settings || {}) as Settings;
};
