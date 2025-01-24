import { meiosisSetup } from 'meiosis-setup';
import { MeiosisCell, MeiosisConfig, Service } from 'meiosis-setup/types';
import m, { FactoryComponent } from 'mithril';
import { routingSvc } from '.';
import { Annotation, Data, Pages, Settings } from '../models';
// import { User, UserRole } from './login-service';
import { scrollToTop } from '../utils';
import {
  fetchData,
  fetchSettings,
  findAnnotatedArticle,
  getAnnotationCount,
  getArticleWithAnnotations,
  getDataCount,
  ID,
  saveAnnotation,
  saveAnnotations,
  saveData,
  saveSettings,
  UNIQUE_ARTICLE_ID,
} from './db';

// const settingsSvc = restServiceFactory<Settings>('settings');
export const APP_TITLE = 'Label Editor';
export const APP_TITLE_SHORT = 'Labeler';

export interface State {
  page: Pages;
  // loggedInUser?: User;
  // role: UserRole;
  settings: Settings;
  searchFilter: string;
  searchResults: any[];
  /** Number of data items */
  dataCount: number;
  /** Number of annotations */
  annotationCount: number;
  /** Current index */
  currentRowId: number;
  /** Initials of currently active annotator  */
  annotator?: string;
  /** Annotation ID, based on current keypath (which may vary between datasets) */
  annotationId?: string | number;
  /** Article ID, based on current keypath (which may vary between datasets) */
  articleId?: string | number;
  /** Currently active article */
  article?: Data;
  /** Currently active annotation item */
  annotation?: Annotation;
}

export interface Actions {
  setPage: (page: Pages, info?: string) => void;
  changePage: (
    page: Pages,
    params?: Record<string, string | number | undefined>,
    query?: Record<string, string | number | undefined>
  ) => void;
  saveSettings: (settings: Settings) => Promise<void>;
  saveData: (dataId: string, articles: any[]) => Promise<void>;
  saveAnnotations: (annotations: Annotation[]) => Promise<void>;
  setSearchFilter: (searchFilter?: string) => Promise<void>;
  setAnnotator: (annotator: string) => void;
  setAnnotation: (id: number, annotation: Annotation) => Promise<void>;
  findAnnotation: (id?: ID, next?: boolean) => Promise<void>;
  /** Update the current data item */
  refreshData: (id: number) => Promise<void>;
}

export type MeiosisComponent<T extends { [key: string]: any } = {}> = FactoryComponent<{
  state: State;
  actions: Actions;
  options?: T;
}>;

export const appActions: (cell: MeiosisCell<State>) => Actions = ({ update, states }) => ({
  // addDucks: (cell, amount) => {
  //   cell.update({ ducks: (value) => value + amount });
  // },
  setPage: (page, info) => {
    document.title = `${APP_TITLE} | ${page.replace('_', ' ')}${info ? ` | ${info}` : ''}`;
    // const curPage = states().page;
    // if (curPage === page) return;
    update({
      page: () => {
        scrollToTop();
        return page;
      },
    });
  },
  changePage: (page, params, query) => {
    routingSvc && routingSvc.switchTo(page, params, query);
    document.title = `${APP_TITLE} | ${page.replace('_', ' ')}`;
    update({ page });
  },
  saveSettings: async (settings: Settings) => {
    await saveSettings(settings);
    console.log(`Data ID: ${settings.dataId}`);

    update({
      settings: () => settings,
    });
  },
  saveData: async (dataId, articles: any[]) => {
    await saveData(dataId, articles);
    const dataCount = await getDataCount();
    const article = articles?.length > 0 ? articles[0] : undefined;
    // console.log(`Fetching data: ${data}`);
    console.log(`Data ID: ${dataId}`);
    update({
      settings: (settings) => ({ ...settings, dataId }),
      article: () => article,
      dataCount,
    });
  },
  saveAnnotations: async (annotations: Annotation[]) => {
    const { settings = {} as Settings } = states();
    const { dataId = UNIQUE_ARTICLE_ID } = settings;
    console.log(`Data ID: ${settings.dataId}`);
    await saveAnnotations(dataId, annotations);
    update({ annotationCount: annotations.length });
  },
  setSearchFilter: async (searchFilter?: string) => {
    if (searchFilter) {
      // localStorage.setItem(SEARCH_FILTER_KEY, searchFilter);
      update({ searchFilter });
    } else {
      update({ searchFilter: undefined });
    }
  },
  setAnnotator: (annotator: string) => update({ annotator }),
  setAnnotation: async (fromId: number, annotation: Annotation) => {
    // console.log(annotation);
    const { settings = {} as Settings } = states();
    const { dataId = UNIQUE_ARTICLE_ID } = settings;
    const annotationCount = await saveAnnotation(dataId, fromId, annotation);
    update({ annotation: () => annotation, annotationCount });
  },
  findAnnotation: async (id?: ID, next = true) => {
    const { settings = {} as Settings } = states();
    const { dataId = UNIQUE_ARTICLE_ID } = settings;
    const { index, article, annotation, annotationId } = await findAnnotatedArticle(dataId, id, next);
    if (index >= 0) {
      update({
        currentRowId: index,
        article: () => article,
        annotation: () => annotation,
        annotationId,
      });
    }
  },
  refreshData: async (currentRowId: number) => {
    // console.log(`Current row id: ${currentRowId}`);
    const { settings = {} as Settings } = states();
    const { dataId = UNIQUE_ARTICLE_ID } = settings;
    const { article, articleId, annotations } = await getArticleWithAnnotations(dataId, currentRowId);

    // const data = await fetchData(currentRowId, 1);
    // const annotations = await fetchAnnotations(currentRowId, 1);
    update({
      articleId,
      currentRowId,
      article: () => article,
      annotation: () => (annotations && annotations.length >= 1 ? annotations[0] : undefined),
    });
  },
});

export const setSearchResults: Service<State> = {
  onchange: (state) => state.searchFilter,
  run: (cell) => {
    // const state = cell.getState();
    // const { searchFilter } = state;
    // console.log(`Searching ${searchFilter}`);
    cell.update({ searchResults: () => [] });
  },
};

const config: MeiosisConfig<State> = {
  app: {
    initial: {
      page: Pages.HOME,
      currentRowId: 0,
      dataCount: 0,
      annotationCount: 0,
      settings: {} as Settings,
    } as State,
    services: [setSearchResults],
  },
};
export const cells = meiosisSetup<State>(config);

cells.map(() => {
  // console.log('...redrawing');
  m.redraw();
});

const loadData = () => {
  // const role = (localStorage.getItem(USER_ROLE) || 'user') as UserRole;
  fetchSettings().then(async (settings) => {
    const { dataId = UNIQUE_ARTICLE_ID } = settings;
    console.log(`Data ID: ${dataId}`);
    const { article, articleId, annotations } = await getArticleWithAnnotations(dataId, 0);
    const dataCount = await getDataCount();
    const annotationCount = await getAnnotationCount();
    // console.log(data);  64. 900
    // console.log(settings);
    cells().update({
      dataCount,
      annotationCount,
      articleId,
      annotator: settings.annotator,
      settings: () => ({ loaded: true, ...settings }),
      article: () => article,
      annotation: () => (annotations && annotations.length > 0 ? annotations[0] : undefined),
    });
  });
};
loadData();
