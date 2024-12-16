import m from 'mithril';
import { Actions, MeiosisComponent, routingSvc, t } from '../../services';
import { FlatButton, ModalPanel } from 'mithril-materialized';
import { Page, Pages, Settings } from '../../models';
import { formatDate, isActivePage } from '../../utils';
import { fetchAnnotations, fetchData, fetchSettings, getAnnotationCount, getDataCount } from '../../services/db';

const handleFileUpload =
  <T>(done: (error: string | null, data: T | null) => Promise<void>) =>
  (e: Event) => {
    const fileInput = e.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length <= 0) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target && e.target.result) {
        try {
          done(null, JSON.parse(e.target.result.toString()) as T);
        } catch (e: any) {
          done(e.toString(), null);
        }
      } else {
        done('Error: Data not imported', null);
      }
    };

    reader.readAsText(fileInput.files[0]);
  };

export const handleSelection = async (
  option: 'clear' | 'import' | 'export',
  dataType: 'data' | 'annotations' | 'settings',
  actions: Actions
) => {
  switch (option) {
    case 'clear':
      console.log('CLEARING DATA NOT IMPLEMENTED');
      break;
    case 'export': {
      let dataStr: string;
      switch (dataType) {
        case 'data': {
          const count = await getDataCount();
          const data = await fetchData(1, count);
          dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
          break;
        }
        case 'annotations': {
          const count = await getAnnotationCount();
          const data = await fetchAnnotations(1, count);
          dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data.map((d) => d.annotation)));
          break;
        }
        case 'settings': {
          const data = await fetchSettings();
          dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
          break;
        }
      }
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute('href', dataStr);
      dlAnchorElem.setAttribute('download', `label-editor_${dataType}_${formatDate(new Date(), '')}.json`);
      dlAnchorElem.click();
      break;
    }
    case 'import': {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      switch (dataType) {
        case 'data': {
          fileInput.onchange = handleFileUpload<any[]>(async (error, data) => {
            if (error) {
              M.toast({ html: error, classes: 'red' });
              console.error(error);
              return;
            }
            if (Array.isArray(data)) {
              await actions.saveData(data);
              routingSvc.switchTo(Pages.HOME);
              M.toast({ html: 'Finished importing data successfully' });
              m.redraw();
            } else {
              const error = 'Invalid file format';
              M.toast({ html: error, classes: 'red' });
              console.error(error);
            }
          });
          break;
        }
        case 'annotations': {
          fileInput.onchange = handleFileUpload<any[]>(async (error, data) => {
            if (error) {
              M.toast({ html: error, classes: 'red' });
              console.error(error);
              return;
            }
            if (Array.isArray(data)) {
              await actions.saveAnnotations(data);
              routingSvc.switchTo(Pages.HOME);
              M.toast({ html: 'Finished importing annotations successfully' });
              m.redraw();
            } else {
              const error = 'Invalid file format';
              M.toast({ html: error, classes: 'red' });
              console.error(error);
            }
          });
          break;
        }
        case 'settings': {
          fileInput.onchange = handleFileUpload<Settings>(async (error, data) => {
            if (error) {
              M.toast({ html: error, classes: 'red' });
              console.error(error);
              return;
            }
            if (data && !Array.isArray(data)) {
              await actions.saveSettings(data);
              routingSvc.switchTo(Pages.HOME);
              M.toast({ html: 'Finished importing settings successfully' });
              m.redraw();
            } else {
              const error = 'Invalid file format';
              M.toast({ html: error, classes: 'red' });
              console.error(error);
            }
          });
          break;
        }
      }
      fileInput.click();
      break;
    }
  }
};

export const SideNav: MeiosisComponent = () => {
  return {
    view: ({ attrs: { state, actions } }) => {
      const { page } = state;
      const { changePage } = actions;
      // const roleIcon = role === 'user' ? 'person' : role === 'editor' ? 'edit' : 'manage_accounts';

      const isActive = isActivePage(page);

      return [
        m(
          '.row',
          m(
            'ul#slide-out.sidenav',
            {
              oncreate: ({ dom }) => {
                M.Sidenav.init(dom);
              },
            },
            routingSvc
              .getList()
              .filter(
                (d) =>
                  d.id !== Pages.LANDING &&
                  ((typeof d.visible === 'boolean' ? d.visible : d.visible(state)) || isActive(d))
              )
              .map((d: Page) =>
                m('li', { class: isActive(d) }, [
                  m(FlatButton, {
                    label: d.title,
                    className: d.iconClass ? ` ${d.iconClass}` : '',
                    // style,
                    iconName: typeof d.icon === 'string' ? d.icon : d.icon ? d.icon() : '',
                    // href: routingSvc.href(d.id),
                    onclick: () => changePage(d.id),
                  }),
                  // ),
                ])
              ),
            // m(
            //   'li',
            //   m(FlatButton, {
            //     label: t('CLEAR'),
            //     iconName: 'clear',
            //     modalId: 'clear_model',
            //   })
            // ),
            m(
              'li',
              m(FlatButton, {
                label: t('EXPORT'),
                // onclick: () => handleSelection('export', 'data'),
                iconName: 'download',
                modalId: 'export',
              })
            ),
            m(
              'li',
              m(FlatButton, {
                label: t('IMPORT'),
                // onclick: () => handleSelection('import', 'data'),
                iconName: 'upload',
                modalId: 'import',
              })
            )
            // m(
            //   'li',
            //   m(FlatButton, {
            //     label: t('PERMALINK'),
            //     onclick: () => handleSelection('link', model, saveModel),
            //     iconName: 'link',
            //   })
            // ),
            // m(
            //   'li',
            //   m(Select, {
            //     checkedId: role,
            //     label: t('ROLE'),
            //     iconName: roleIcon,
            //     options: [
            //       { id: 'user', label: t('USER') },
            //       { id: 'editor', label: t('EDITOR') },
            //       { id: 'admin', label: t('ADMIN') },
            //     ],
            //     onchange: (role) => {
            //       setRole(role[0]);
            //     },
            //   } as ISelectOptions<UserRole>)
            // ),
            // m(
            //   'li',
            //   m(LanguageSwitcher, {
            //     onLanguageChange: async (language: Languages) => {
            //       await i18n.loadAndSetLocale(language as Languages);
            //     },
            //     currentLanguage: i18n.currentLocale,
            //   })
            // )
          )
        ),
        m(ModalPanel, {
          id: 'import',
          title: t('IMPORT'),
          description: m('.row', m('.col.s12', m('p', 'Select the data you wish to import'))),
          buttons: [
            {
              label: t('DATA'),
              iconName: 'data_array',
              onclick: () => handleSelection('import', 'data', actions),
            },
            {
              label: t('ANNOTATION', 2),
              iconName: 'dataset',
              onclick: () => handleSelection('import', 'annotations', actions),
            },
            {
              label: t('SETTINGS', 'TITLE'),
              iconName: 'data_object',
              onclick: () => handleSelection('import', 'settings', actions),
            },
          ],
        }),
        m(ModalPanel, {
          id: 'export',
          title: t('EXPORT'),
          description: m('.row', m('.col.s12', m('p', 'Select the data you wish to export'))),
          buttons: [
            {
              label: t('DATA'),
              iconName: 'data_array',
              onclick: () => handleSelection('export', 'data', actions),
            },
            {
              label: t('ANNOTATION', 2),
              iconName: 'dataset',
              onclick: () => handleSelection('export', 'annotations', actions),
            },
            {
              label: t('SETTINGS', 'TITLE'),
              iconName: 'data_object',
              onclick: () => handleSelection('export', 'settings', actions),
            },
          ],
        }),
      ];
    },
  };
};

export const SideNavTrigger: MeiosisComponent<{}> = () => {
  return {
    view: () => {
      return m(
        'a',
        {
          href: '#!',
          style: {
            position: 'relative',
            top: '20px',
            marginLeft: '20px',
          },
          'data-target': 'slide-out',
          class: 'sidenav-trigger',
        },
        m('i.material-icons', 'menu')
      );
    },
  };
};
