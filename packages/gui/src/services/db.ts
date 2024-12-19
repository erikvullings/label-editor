import { deleteDB, openDB } from 'idb';
import { Annotation, Data, Settings } from '../models';

export type ID = string | number;

const DB_NAME = 'LabelEditorDB';
const DATA_STORE = 'dataStore';
const ANNOTATION_STORE = 'annotationStore';
const SETTINGS_STORE = 'settingsStore';
const UNIQUE_ARTICLE_ID = '$articleId';

// let ARTICLE_ID = UNIQUE_ARTICLE_ID;
export type StoredAnnotation = Annotation & {
  [key: string]: ID;
};

const initDB = async (keyPath = UNIQUE_ARTICLE_ID) => {
  // ARTICLE_ID = dataId ? dataId : UNIQUE_ARTICLE_ID;
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE, { keyPath, autoIncrement: keyPath === UNIQUE_ARTICLE_ID });
      }
      if (!db.objectStoreNames.contains(ANNOTATION_STORE)) {
        db.createObjectStore(ANNOTATION_STORE, {
          keyPath,
          autoIncrement: keyPath === UNIQUE_ARTICLE_ID,
        });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

const resetDB = async () => {
  const db = await openDB(DB_NAME, 1);
  db.close();
  deleteDB(DB_NAME);
};

/** Save data to IndexedDB */
export const saveData = async (articles: any[], dataId?: string) => {
  const settings = await fetchSettings();
  await resetDB();
  const db = await initDB(dataId);
  if (settings) {
    await saveSettings(settings);
  }
  const tx = db.transaction(DATA_STORE, 'readwrite');
  await Promise.all([...articles.map((d) => tx.store.add(d)), tx.done]);
};

// Fetch data from IndexedDB
export const fetchData = async (fromKey = 1, count = 100): Promise<Data[]> => {
  const db = await initDB();
  const store = db.transaction(DATA_STORE).objectStore(DATA_STORE);
  return (await store.getAll(IDBKeyRange.bound(fromKey, fromKey + count - 1))) || [];
};

const getAnnotationsForArticle = async (articleId?: ID): Promise<StoredAnnotation[]> => {
  if (typeof articleId === 'undefined') return [];
  console.log(`Getting annotations for ${articleId}`);
  const db = await initDB();
  const tx = db.transaction(ANNOTATION_STORE, 'readonly');
  const store = tx.store;
  const found = await store.getAll(articleId);
  console.log(found);
  return found;
};

export const getArticleWithAnnotations = async (
  articleIdx: number
): Promise<{ article?: Data; articleId?: ID; annotations?: StoredAnnotation[] }> => {
  const db = await initDB();
  const tx = db.transaction([DATA_STORE, ANNOTATION_STORE], 'readonly');
  const dataStore = tx.objectStore(DATA_STORE);

  let articleId: ID | undefined = undefined;
  let article: Data | undefined = undefined;
  let annotations: StoredAnnotation[] | undefined = undefined;
  let cursor = await dataStore.openCursor();
  while (cursor && articleIdx >= 0) {
    if (articleIdx-- === 0) {
      articleId = cursor.key as ID;
      article = cursor.value;
      break;
    }
    cursor = await cursor.continue();
  }
  if (articleId) {
    annotations = await getAnnotationsForArticle(articleId);
  }
  return { article, articleId, annotations };
};

const findIndexAndValue = async <T extends Data | StoredAnnotation>(
  storeName: string,
  targetId?: ID
): Promise<{ index: number; value?: T }> => {
  let index = 0;
  const db = await initDB();
  let cursor = await db.transaction(storeName).store.openCursor();

  while (cursor) {
    if (cursor.key === targetId) {
      return {
        index,
        value: cursor.value as T,
      };
    }
    index++;
    cursor = await cursor.continue();
  }

  return { index: -1 };
};

export const findAnnotatedArticle = async (
  annotationId?: ID,
  next = true
): Promise<{
  index: number;
  article?: Data;
  annotationId?: ID;
  annotation?: StoredAnnotation;
}> => {
  console.log('findAnnotatedArticle');
  const db = await initDB();
  const tx = db.transaction(ANNOTATION_STORE, 'readonly');
  const annotationStore = tx.objectStore(ANNOTATION_STORE);

  let id: ID | undefined = undefined;
  let annotation: StoredAnnotation | undefined = undefined;

  let cursor = await annotationStore.openCursor();
  if (typeof annotationId === 'undefined' && cursor) {
    id = cursor.key as ID;
    annotation = cursor.value as StoredAnnotation;
  } else {
    let prevKey: ID | undefined = undefined;
    let prevAnnotation: Annotation | undefined = undefined;

    while (cursor) {
      const key = cursor.key as ID;
      if (key === annotationId) {
        // Found current annotation
        if (next) {
          cursor = await cursor.continue();
          if (cursor) {
            id = cursor.key as ID;
            annotation = cursor.value as StoredAnnotation;
          }
        } else {
          id = prevKey;
          annotation = prevAnnotation;
        }
        break;
      } else {
        prevKey = key;
        prevAnnotation = cursor.value as StoredAnnotation;
      }
      cursor = await cursor.continue();
    }
  }
  const { index, value: article } = await findIndexAndValue<Data>(DATA_STORE, id);
  return { index, article, annotation, annotationId: id };
};

export const getDataCount = async () => {
  const db = await initDB();
  const store = db.transaction(DATA_STORE).objectStore(DATA_STORE);
  return await store.count();
};

/** Save annotations to IndexedDB */
export const saveAnnotations = async (annotations: Annotation[]) => {
  const db = await initDB();
  const tx = db.transaction(ANNOTATION_STORE, 'readwrite');
  await Promise.all([...annotations.map((d) => tx.store.add(d)), tx.done]);
};

// Save annotation to IndexedDB
export const saveAnnotation = async (articleId: ID, annotation: Annotation) => {
  const db = await initDB();
  const tx = db.transaction(ANNOTATION_STORE, 'readwrite');
  const store = tx.objectStore(ANNOTATION_STORE);
  await store.put(annotation as StoredAnnotation, articleId);
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
  return await store.count();
};

export const saveSettings = async (settings: Settings) => {
  const db = await initDB();
  const tx = db.transaction(SETTINGS_STORE, 'readwrite');
  const store = tx.objectStore(SETTINGS_STORE);
  await store.put({ id: 1, settings });
  await tx.done;
};

export const fetchSettings = async (): Promise<Settings> => {
  const db = await initDB();
  const tx = db.transaction(SETTINGS_STORE, 'readonly');
  const store = tx.objectStore(SETTINGS_STORE);
  return ((await store.get(1))?.settings || {}) as Settings;
};
