import { deleteDB, openDB } from 'idb';
import { Annotation, Data, Settings } from '../models';

const DB_NAME = 'LabelEditorDB';
const DATA_STORE = 'dataStore';
const ANNOTATION_STORE = 'annotationStore';
const SETTINGS_STORE = 'settingsStore';
const UNIQUE_ARTICLE_ID = '$articleId';
const BY_ARTICLE_IDX = 'by_article_id';

export type StoredAnnotation = Annotation & {
  [UNIQUE_ARTICLE_ID]: number;
};

const initDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE, { keyPath: UNIQUE_ARTICLE_ID, autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(ANNOTATION_STORE)) {
        const annotationStore = db.createObjectStore(ANNOTATION_STORE, {
          keyPath: 'annotationId',
          autoIncrement: true,
        });
        // Create an index on the data ID to allow efficient lookups
        annotationStore.createIndex(BY_ARTICLE_IDX, UNIQUE_ARTICLE_ID, { unique: false });
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
export const saveData = async (articles: any[]) => {
  const settings = await fetchSettings();
  await resetDB();
  if (settings) {
    await saveSettings(settings);
  }
  const db = await initDB();
  const tx = db.transaction(DATA_STORE, 'readwrite');
  await Promise.all([...articles.map((d) => tx.store.add(d)), tx.done]);
};

// Fetch data from IndexedDB
export const fetchData = async (fromKey = 1, count = 100): Promise<Data[]> => {
  const db = await initDB();
  const store = db.transaction(DATA_STORE).objectStore(DATA_STORE);
  return (await store.getAll(IDBKeyRange.bound(fromKey, fromKey + count - 1))) || [];
};

export const getAnnotationsForArticle = async (articleId: string | any): Promise<StoredAnnotation[]> => {
  if (typeof articleId !== 'number') {
    articleId = articleId[UNIQUE_ARTICLE_ID];
  }
  console.log(`Getting annotations for ${articleId}`);
  const db = await initDB();
  const tx = db.transaction(ANNOTATION_STORE, 'readonly');
  const store = tx.store;

  // Use the index to find annotations for a specific article
  const index = store.index(BY_ARTICLE_IDX);
  const found = await index.getAll(articleId);
  console.log(found);
  return found;
};

export const getArticleWithAnnotations = async (
  articleId: number
): Promise<{ article?: Data; annotations?: StoredAnnotation[] }> => {
  console.log('getArticleWithAnnotations');
  const db = await initDB();
  const tx = db.transaction([DATA_STORE, ANNOTATION_STORE], 'readonly');
  const dataStore = tx.objectStore(DATA_STORE);

  const article = await dataStore.get(articleId);
  if (!article) return { article: undefined, annotations: undefined };

  const annotations = await getAnnotationsForArticle(articleId);

  return { article, annotations };
};

export const findUnannotatedArticles = async (): Promise<Data[]> => {
  const db = await initDB();
  const tx = db.transaction([DATA_STORE, ANNOTATION_STORE], 'readonly');
  const dataStore = tx.objectStore(DATA_STORE);
  const annotationStore = tx.objectStore(ANNOTATION_STORE);
  const index = annotationStore.index(BY_ARTICLE_IDX);

  const unannotatedArticles: Data[] = [];

  const cursor = await dataStore.openCursor();
  while (cursor) {
    const articleId = cursor.key as string;
    const countRequest = await index.count(articleId);
    if (countRequest === 0) {
      unannotatedArticles.push(cursor.value);
      break;
    }
    cursor.continue();
  }
  return unannotatedArticles;
};

export const getDataCount = async () => {
  const db = await initDB();
  const store = db.transaction(DATA_STORE).objectStore(DATA_STORE);
  return await store.count();
};

/** Save annotations to IndexedDB */
export const saveAnnotations = async (data: any[]) => {
  const db = await initDB();
  const tx = db.transaction(ANNOTATION_STORE, 'readwrite');
  await Promise.all([...data.map((d, i) => tx.store.add({ [UNIQUE_ARTICLE_ID]: i + 1, ...d })), tx.done]);
};

// Save annotation to IndexedDB
export const saveAnnotation = async (dataId: number, annotation: Annotation) => {
  const db = await initDB();
  const tx = db.transaction(ANNOTATION_STORE, 'readwrite');
  const store = tx.objectStore(ANNOTATION_STORE);
  await store.put({ [UNIQUE_ARTICLE_ID]: dataId, ...annotation } as StoredAnnotation);
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
  await store.put({ id: 1, settings });
  await tx.done;
};

export const fetchSettings = async (): Promise<Settings> => {
  const db = await initDB();
  const tx = db.transaction(SETTINGS_STORE, 'readonly');
  const store = tx.objectStore(SETTINGS_STORE);
  return ((await store.get(1))?.settings || {}) as Settings;
};
