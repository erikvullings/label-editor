import m from 'mithril';
import { Pages } from '../models';
import { MeiosisComponent, t } from '../services';
import { SlimdownView } from 'mithril-ui-form';

export const AboutPage: MeiosisComponent = () => {
  return {
    oninit: ({
      attrs: {
        actions: { setPage },
      },
    }) => setPage(Pages.ABOUT),
    view: () => {
      return m(
        '#about-page.row.about.page',
        m(SlimdownView, { md: t('ABOUT', 'BODY'), externalLinks: true, removeParagraphs: true })
      );
    },
  };
};
