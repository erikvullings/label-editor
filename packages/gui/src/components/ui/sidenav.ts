import m from 'mithril';
import { Actions, MeiosisComponent, routingSvc, t } from '../../services';
import { FlatButton, IInputOption, ModalPanel, Select } from 'mithril-materialized';
import { Data, Page, Pages, Settings } from '../../models';
import { extractPropertyKeys, formatDate, isActivePage } from '../../utils';
import { fetchAnnotations, fetchData, fetchSettings, getAnnotationCount, getDataCount } from '../../services/db';

const handleFileUpload =
  <T>(dialog: M.Modal | undefined, done: (error: string | null, data: T | null) => Promise<void>) =>
  (e: Event) => {
    const fileInput = e.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length <= 0) return;

    const reader = new FileReader();
    dialog?.open();

    reader.onprogress = (e: ProgressEvent<FileReader>) => {
      if (e.lengthComputable && dialog?.isOpen) {
        const percentLoaded = Math.round((e.loaded / e.total) * 100);
        const progressBar = document.body.querySelector('.determinate') as HTMLDivElement;
        if (progressBar) progressBar.style.width = `${percentLoaded}%`;
      }
    };

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
      dialog?.close();
    };

    reader.onerror = () => {
      done('Error: Failed to read file', null);
      dialog?.close();
    };

    reader.readAsText(fileInput.files[0]);
  };

export const handleSelection = async (
  option: 'clear' | 'import' | 'export',
  dataType: 'data' | 'annotations' | 'settings',
  actions: Actions,
  dialog: M.Modal | undefined,
  onLoaded?: (data: Data[]) => Promise<void>
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
          fileInput.onchange = handleFileUpload<any[]>(dialog, async (error, data) => {
            if (error) {
              M.toast({ html: error, classes: 'red' });
              console.error(error);
              return;
            }
            if (Array.isArray(data)) {
              if (onLoaded) {
                onLoaded(data);
              }
              // // const first = data.length > 0 ? data[0] : undefined;
              // // if (dialog && first) {
              // //   propertyKeys = extractPropertyKeys
              // //   dialog.open();
              // await actions.saveData(data);
              // routingSvc.switchTo(Pages.HOME);
              // M.toast({ html: 'Finished importing data successfully' });
              // m.redraw();
            } else {
              const error = 'Invalid file format';
              M.toast({ html: error, classes: 'red' });
              console.error(error);
            }
          });
          break;
        }
        case 'annotations': {
          fileInput.onchange = handleFileUpload<any[]>(dialog, async (error, data) => {
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
          fileInput.onchange = handleFileUpload<Settings>(dialog, async (error, data) => {
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
  let progressDialog: M.Modal | undefined = undefined;
  let setupDialog: M.Modal | undefined = undefined;

  let dataId: string | undefined = undefined;
  let titleId: string | undefined = undefined;
  let textId: string | undefined = undefined;
  let urlId: string | undefined = undefined;
  let propertyKeys: IInputOption<string>[] = [];
  let data: Data[] | undefined = undefined;

  return {
    view: ({ attrs: { state, actions } }) => {
      const { page, settings = {} as Settings } = state;
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
          id: 'progress',
          title: 'Loading data...',
          description: m('.progress', m('.determinate', { style: { width: 0 } })),
          onCreate: (modal) => (progressDialog = modal),
        }),
        m(ModalPanel, {
          id: 'dialog',
          title: 'Setup',
          description: m(
            '.row',
            m(
              '.setup',
              m(Select<string>, {
                label: 'Select unique key in data',
                checkedId: dataId,
                options: propertyKeys,
                onchange: (id) => (dataId = id[0]),
              }),
              m(Select<string>, {
                label: 'Select key for title',
                checkedId: titleId,
                options: propertyKeys,
                onchange: (id) => (titleId = id[0]),
              }),
              m(Select<string>, {
                label: 'Select key for text',
                checkedId: textId,
                options: propertyKeys,
                onchange: (id) => (textId = id[0]),
              }),
              m(Select<string>, {
                label: 'Select key for URL',
                checkedId: urlId,
                options: propertyKeys,
                onchange: (id) => (urlId = id[0]),
              })
            )
          ),
          buttons: [
            {
              label: t('IMPORT'),
              onclick: async () => {
                console.log(data);
                if (data) {
                  if (!settings.template) {
                    settings.template = `# {{${titleId}}}
                    
{{${textId}}}

[Open article]({{${urlId}}})`;
                    await actions.saveSettings(settings);
                  }
                  await actions.saveData(data, dataId);
                  routingSvc.switchTo(Pages.HOME);
                  M.toast({ html: 'Finished importing data successfully' });
                  m.redraw();
                }
              },
            },
          ],
          onCreate: (modal) => (setupDialog = modal),
        }),
        m(ModalPanel, {
          id: 'import',
          title: t('IMPORT'),
          description: m('.row', m('.col.s12', m('p', 'Select the data you wish to import'))),
          buttons: [
            {
              label: t('DATA'),
              iconName: 'data_array',
              onclick: () =>
                handleSelection('import', 'data', actions, progressDialog, async (loadedData) => {
                  const first = loadedData.length > 0 ? loadedData[0] : undefined;
                  if (setupDialog && first) {
                    data = loadedData;
                    const keys = extractPropertyKeys(first);
                    propertyKeys = keys.map((key) => ({ id: key, label: key }));
                    dataId = keys.filter((key) => /id/i.test(key)).shift();
                    titleId = keys.filter((key) => /tit/i.test(key)).shift();
                    textId = keys.filter((key) => /text|tek|body/i.test(key)).shift();
                    urlId = keys.filter((key) => /url/i.test(key)).shift();
                    console.table(keys);
                    console.table({ dataId, titleId, textId, urlId });
                    m.redraw();
                    setTimeout(() => setupDialog!.open());
                  }
                }),
            },
            {
              label: t('ANNOTATION', 2),
              iconName: 'dataset',
              onclick: () => handleSelection('import', 'annotations', actions, progressDialog),
            },
            {
              label: t('SETTINGS', 'TITLE'),
              iconName: 'data_object',
              onclick: () => handleSelection('import', 'settings', actions, progressDialog),
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
              onclick: () => handleSelection('export', 'data', actions, progressDialog),
            },
            {
              label: t('ANNOTATION', 2),
              iconName: 'dataset',
              onclick: () => handleSelection('export', 'annotations', actions, progressDialog),
            },
            {
              label: t('SETTINGS', 'TITLE'),
              iconName: 'data_object',
              onclick: () => handleSelection('export', 'settings', actions, progressDialog),
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
            position: 'fixed',
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
