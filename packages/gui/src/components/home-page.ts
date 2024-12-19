import m from 'mithril';
import { Pages } from '../models';
import { MeiosisComponent } from '../services';
import { LabelEditor } from './ui/label-editor';
import { Pagination } from './ui/pagination';

export const HomePage: MeiosisComponent = () => {
  return {
    oninit: async ({
      attrs: {
        actions: { setPage, refreshData },
      },
    }) => {
      await refreshData(0);
      setPage(Pages.HOME);
    },
    view: ({ attrs }) => {
      const {
        state: { article: data, dataCount, currentRowId, annotationId },
        actions: { refreshData, findAnnotation },
      } = attrs;
      if (!data) {
        refreshData(1);
      }

      return m('#home-page.row.home.page.center-align', [
        m(LabelEditor, attrs),
        m(
          '.col.s12',
          m(Pagination, {
            currentPage: currentRowId,
            totalPages: dataCount || 0,
            onPageChange: async (newPage) => {
              await refreshData(newPage);
            },
            onFindAnnotation: async (next) => {
              await findAnnotation(annotationId, next);
            },
          })
        ),
      ]);
    },
  };
};
