import m from 'mithril';
import { Pages } from '../models';
import { MeiosisComponent } from '../services';
import { LabelEditor } from './ui/label-editor';
import { Pagination } from './ui/pagination';
import { getAnnotationCount, getDataCount } from '../services/db';

export const HomePage: MeiosisComponent = () => {
  return {
    oninit: async ({
      attrs: {
        actions: { setPage, refreshData },
      },
    }) => {
      await refreshData(1);
      const count = await getDataCount();
      if (count) console.log(count);
      // data = await fetchData();
      // console.log(data);
      setPage(Pages.HOME);
    },
    view: ({ attrs }) => {
      const {
        state: { data, dataCount, currentRowId },
        actions: { refreshData },
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
            onFastForward: async () => {
              // Goto last annotation
              const lastId = await getAnnotationCount();
              if (typeof lastId === 'number') {
                await refreshData(lastId);
              }
            },
          })
        ),
      ]);
    },
  };
};
