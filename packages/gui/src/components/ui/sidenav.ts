import m from 'mithril';
import { MeiosisComponent, routingSvc, t } from '../../services';
import { FlatButton, ModalPanel, padLeft } from 'mithril-materialized';
import { DataModel, Page, Pages, EmptyDataModel } from '../../models';
import { formatDate, isActivePage } from '../../utils';
import { saveData } from '../../services/db';

const handleFileUpload = () => (e: Event) => {
  const fileInput = e.target as HTMLInputElement;
  if (!fileInput.files || fileInput.files.length <= 0) return;

  const reader = new FileReader();
  reader.onload = async (e: ProgressEvent<FileReader>) => {
    if (e.target && e.target.result) {
      const data = JSON.parse(e.target.result.toString()) as any[];
      if (Array.isArray(data)) {
        // saveModel(result);
        await saveData(data);
        console.log(data);

        routingSvc.switchTo(Pages.HOME);
        m.redraw();
      } else {
        console.error('Invalid file format');
      }
    }
  };

  reader.readAsText(fileInput.files[0]);
};

export const handleSelection = (option: string, model: DataModel, saveModel?: (model: DataModel) => void) => {
  switch (option) {
    case 'clear':
      console.log('CLEARING DATAS');
      saveModel && saveModel(EmptyDataModel());
      break;
    case 'download_json': {
      const version = typeof model.version === 'undefined' ? 1 : ++model.version;
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ ...model, version }, null, 2));
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute('href', dataStr);
      dlAnchorElem.setAttribute('download', `${formatDate()}_v${padLeft(version, 3)}_crime_scripts.json`);
      dlAnchorElem.click();
      break;
    }
    case 'upload_json': {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.onchange = handleFileUpload();
      fileInput.click();
      break;
    }
  }
};

export const SideNav: MeiosisComponent = () => {
  return {
    view: ({
      attrs: {
        state,
        actions: { saveModel, changePage },
      },
    }) => {
      const { model, page } = state;
      // const roleIcon = role === 'user' ? 'person' : role === 'editor' ? 'edit' : 'manage_accounts';

      const isActive = isActivePage(page);

      return [
        m(
          '.row',
          m(
            'ul#slide-out.sidenav',
            {
              oncreate: ({ dom }) => {
                console.log(dom);
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
                label: t('DOWNLOAD'),
                onclick: () => handleSelection('download_json', model, saveModel),
                iconName: 'download',
              })
            ),
            m(
              'li',
              m(FlatButton, {
                label: t('UPLOAD'),
                onclick: () => handleSelection('upload_json', model, saveModel),
                iconName: 'upload',
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
          id: 'clear_model',
          title: t('DELETE_ITEM', 'TITLE', { item: t('MODEL') }),
          description: t('DELETE_ITEM', 'DESCRIPTION', { item: t('MODEL').toLowerCase() }),
          buttons: [
            { label: t('CANCEL'), iconName: 'cancel' },
            {
              label: t('DELETE'),
              iconName: 'delete',
              onclick: () => {
                saveModel(EmptyDataModel());
              },
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
