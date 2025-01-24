import { deleteDB, openDB } from 'idb';
import { Annotation, Data, Settings } from '../models';
import { filterUniqueItems } from '../utils';

export type ID = string | number;

const DB_NAME = 'LabelEditorDB';
const DATA_STORE = 'dataStore';
const ANNOTATION_STORE = 'annotationStore';
const SETTINGS_STORE = 'settingsStore';
export const UNIQUE_ARTICLE_ID = '$articleId';

// let ARTICLE_ID = UNIQUE_ARTICLE_ID;
export type StoredAnnotation = Annotation & {
  [key: string]: ID;
};

const initDB = async (keyPath: string) => {
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
export const saveData = async (dataId: string, articles: any[]) => {
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
export const fetchData = async (dataId: string, fromKey = 1, count = 100): Promise<Data[]> => {
  const db = await initDB(dataId);
  const store = db.transaction(DATA_STORE).objectStore(DATA_STORE);
  return (await store.getAll(IDBKeyRange.bound(fromKey, fromKey + count - 1))) || [];
};

export const fetchAllData = async (dataId: string): Promise<Data[]> => {
  const db = await initDB(dataId);
  return (await db.getAll(DATA_STORE)) as Data[];
};

const getAnnotationsForArticle = async (dataId: string, articleId?: ID): Promise<StoredAnnotation[]> => {
  if (typeof articleId === 'undefined') return [];
  // console.log(`Getting annotations for ${articleId}`);
  const db = await initDB(dataId);
  const tx = db.transaction(ANNOTATION_STORE, 'readonly');
  const store = tx.store;
  const found = await store.getAll(articleId);
  // console.log(found);
  return found;
};

export const getArticleWithAnnotations = async (
  dataId: string,
  articleIdx: number
): Promise<{ article?: Data; articleId?: ID; annotations?: StoredAnnotation[] }> => {
  const db = await initDB(dataId);
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
    annotations = await getAnnotationsForArticle(dataId, articleId);
  }
  return { article, articleId, annotations };
};

const findIndexAndValue = async <T extends Data | StoredAnnotation>(
  dataId: string,
  storeName: string,
  targetId?: ID
): Promise<{ index: number; value?: T }> => {
  let index = 0;
  const db = await initDB(dataId);
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
  dataId: string,
  annotationId?: ID,
  next = true
): Promise<{
  index: number;
  article?: Data;
  annotationId?: ID;
  annotation?: StoredAnnotation;
}> => {
  // console.log('findAnnotatedArticle');
  const db = await initDB(dataId);
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
  const { index, value: article } = await findIndexAndValue<Data>(dataId, DATA_STORE, id);
  return { index, article, annotation, annotationId: id };
};

export const getDataCount = async () => {
  const db = await initDB('');
  const store = db.transaction(DATA_STORE).objectStore(DATA_STORE);
  return await store.count();
};

/** Save annotations to IndexedDB */
export const saveAnnotations = async (dataId: string, annotations: Annotation[]) => {
  const db = await initDB(dataId);
  const tx = db.transaction(ANNOTATION_STORE, 'readwrite');
  const store = tx.objectStore(ANNOTATION_STORE);
  store.clear();
  await Promise.all([
    ...filterUniqueItems(annotations, dataId).map((d) => {
      return tx.store.add(d);
    }),
    tx.done,
  ]);
};

// Save annotation to IndexedDB
export const saveAnnotation = async (dataId: string, articleId: ID, annotation: Annotation): Promise<number> => {
  console.log(`Saving annotation for ${articleId} and data ID: ${dataId}`);
  annotation[dataId] = articleId;
  const db = await initDB(dataId);
  const tx = db.transaction(ANNOTATION_STORE, 'readwrite');
  const store = tx.objectStore(ANNOTATION_STORE);
  await store.put(annotation as StoredAnnotation);
  const count = await store.count();
  await tx.done;
  return count;
};

// Fetch annotations
export const fetchAnnotations = async (dataId: string): Promise<StoredAnnotation[]> => {
  const db = await initDB(dataId);
  return (await db.getAll(ANNOTATION_STORE)) as StoredAnnotation[];
};

export const getAnnotationCount = async () => {
  const db = await initDB('');
  const store = db.transaction(ANNOTATION_STORE).objectStore(ANNOTATION_STORE);
  return await store.count();
};

export const saveSettings = async (settings: Settings) => {
  const db = await initDB('');
  const tx = db.transaction(SETTINGS_STORE, 'readwrite');
  const store = tx.objectStore(SETTINGS_STORE);
  await store.put({ id: 1, settings });
  await tx.done;
};

export const fetchSettings = async (): Promise<Settings> => {
  const db = await initDB('');
  const tx = db.transaction(SETTINGS_STORE, 'readonly');
  const store = tx.objectStore(SETTINGS_STORE);
  return ((await store.get(1))?.settings || {}) as Settings;
};
