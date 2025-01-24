import m from 'mithril';
import logo from '../assets/logo.svg';
import { Pages } from '../models';
import { routingSvc } from '../services/routing-service';
import { APP_TITLE, MeiosisComponent, t } from '../services';
import { SideNav, SideNavTrigger } from './ui/sidenav';
import { TextInputWithClear } from './ui/text-input-with-clear';

export const Layout: MeiosisComponent = () => {
  let searchDialog: M.Modal;
  let textInput: HTMLInputElement;

  document.addEventListener('keydown', (ev: KeyboardEvent) => {
    if (
      ev.key !== '/' ||
      searchDialog?.isOpen ||
      (ev.target && (ev.target as HTMLTextAreaElement).type === 'textarea') ||
      (ev.target as HTMLInputElement).type === 'text'
    )
      return;
    ev.preventDefault(); // Prevent the slash key from being inputted into input fields
    searchDialog.open();
    textInput.focus();
  });

  return {
    view: ({ children, attrs: { state, actions } }) => {
      const { searchFilter, searchResults } = state;
      const { setSearchFilter } = actions;

      return [
        m('.main', { style: 'overflow-x: hidden' }, [
          m(
            '.navbar-fixed',
            m(
              'nav',
              m('.nav-wrapper.center-align', [
                m(
                  'a.brand-logo',
                  {
                    title: APP_TITLE,
                    style: { color: 'black', position: 'relative' },
                    href: routingSvc.href(Pages.LANDING),
                  },
                  [
                    m('img[width=50][height=50][alt=logo]', {
                      src: logo,
                      style: { marginTop: '10px' },
                    }),
                    m('span', { style: 'margin-left: 20px; vertical-align: top;' }, APP_TITLE),
                  ]
                ),
              ])
            ),
            m(SideNavTrigger, { state, actions })
          ),
          m(SideNav, { state, actions }),
          // (isSmallPage() || (curPage && curPage.hasSidebar)) && [
          //   m(SideNavTrigger, { state, actions }),
          //   m(SideNav, { state, actions }),
          // ],
          m(
            '#searchDialog.modal',
            {
              oncreate: ({ dom }) => {
                searchDialog = M.Modal.init(dom, {
                  onOpenEnd: () => {
                    if (textInput) {
                      textInput.focus();
                    }
                  },
                });
              },
            },
            [
              m('.modal-content.row', [
                m(TextInputWithClear, {
                  id: 'search',
                  label: t('SEARCH'),
                  onchange: () => {},
                  iconName: 'search',
                  initialValue: searchFilter,
                  oninput: (v) => {
                    setSearchFilter(v);
                  },
                  oncreate: ({ dom }) => (textInput = dom.querySelector('input') as HTMLInputElement),
                }),
                searchDialog &&
                  searchDialog.isOpen &&
                  searchFilter &&
                  searchResults && [[m('pre', t('HITS', searchResults.length))], searchResults.length > 0 && []],
              ]),
            ]
          ),
          m('.container', children),
          ,
        ]),
      ];
    },
  };
};
