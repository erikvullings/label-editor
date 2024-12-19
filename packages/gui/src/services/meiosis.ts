import { meiosisSetup } from 'meiosis-setup';
import { MeiosisCell, MeiosisConfig, Service } from 'meiosis-setup/types';
import m, { FactoryComponent } from 'mithril';
import { routingSvc } from '.';
import { Annotation, Data, Pages, Settings } from '../models';
import { User, UserRole } from './login-service';
import { scrollToTop } from '../utils';
import {
  fetchData,
  fetchSettings,
  findAnnotatedArticle,
  getArticleWithAnnotations,
  getDataCount,
  ID,
  saveAnnotation,
  saveAnnotations,
  saveData,
  saveSettings,
} from './db';

// const settingsSvc = restServiceFactory<Settings>('settings');
const USER_ROLE = 'USER_ROLE';
export const APP_TITLE = 'Label Editor';
export const APP_TITLE_SHORT = 'Labeler';

export interface State {
  page: Pages;
  loggedInUser?: User;
  role: UserRole;
  settings: Settings;
  searchFilter: string;
  searchResults: any[];
  /** Number of data items */
  dataCount: number;
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
  saveData: (articles: any[]) => Promise<void>;
  saveAnnotations: (annotations: Annotation[]) => Promise<void>;
  setRole: (role: UserRole) => void;
  setSearchFilter: (searchFilter?: string) => Promise<void>;
  setAnnotator: (annotator: string) => void;
  setAnnotation: (id: number, annotation: Annotation) => Promise<void>;
  findAnnotation: (id?: ID, next?: boolean) => Promise<void>;
  /** Update the current data item */
  refreshData: (id: number) => Promise<void>;
  login: () => void;
}

export type MeiosisComponent<T extends { [key: string]: any } = {}> = FactoryComponent<{
  state: State;
  actions: Actions;
  options?: T;
}>;

export const appActions: (cell: MeiosisCell<State>) => Actions = ({ update /* states */ }) => ({
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
    update({
      settings: () => settings,
    });
  },
  saveData: async (articles: any[], dataId: string = '_id') => {
    await saveData(articles, dataId);
    const dataCount = await getDataCount();
    const data = await fetchData(1, 1);
    console.log(`Fetching data: ${data}`);
    update({
      article: () => (data && data.length > 0 ? data[0] : undefined),
      dataCount,
    });
  },
  saveAnnotations: async (annotations: Annotation[]) => {
    await saveAnnotations(annotations);
  },
  setSearchFilter: async (searchFilter?: string) => {
    if (searchFilter) {
      // localStorage.setItem(SEARCH_FILTER_KEY, searchFilter);
      update({ searchFilter });
    } else {
      update({ searchFilter: undefined });
    }
  },
  setRole: (role) => {
    localStorage.setItem(USER_ROLE, role);
    update({ role });
  },
  setAnnotator: (annotator: string) => update({ annotator }),
  setAnnotation: async (fromId: number, annotation: Annotation) => {
    console.log(annotation);
    await saveAnnotation(fromId, annotation);
    update({ annotation: () => annotation });
  },
  findAnnotation: async (id?: ID, next = true) => {
    const { index, article, annotation, annotationId } = await findAnnotatedArticle(id, next);
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
    console.log(`Current row id: ${currentRowId}`);
    const { article, articleId, annotations } = await getArticleWithAnnotations(currentRowId);

    // const data = await fetchData(currentRowId, 1);
    // const annotations = await fetchAnnotations(currentRowId, 1);
    update({
      articleId,
      currentRowId,
      article: () => article,
      annotation: () => (annotations && annotations.length >= 1 ? annotations[0] : undefined),
    });
  },
  login: () => {},
});

export const setSearchResults: Service<State> = {
  onchange: (state) => state.searchFilter,
  run: (cell) => {
    const state = cell.getState();
    const { searchFilter } = state;
    console.log(`Searching ${searchFilter}`);
    cell.update({ searchResults: () => [] });
  },
};

const config: MeiosisConfig<State> = {
  app: {
    initial: {
      page: Pages.HOME,
      loggedInUser: undefined,
      role: 'user',
      currentRowId: 1,
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
    const { article, articleId, annotations } = await getArticleWithAnnotations(0);
    const dataCount = await getDataCount();
    // console.log(data);
    // console.log(settings);
    cells().update({
      role: 'admin',
      dataCount,
      articleId,
      settings: () => settings,
      article: () => article,
      annotation: () => (annotations && annotations.length > 0 ? annotations[0] : undefined),
    });
  });
};
loadData();
