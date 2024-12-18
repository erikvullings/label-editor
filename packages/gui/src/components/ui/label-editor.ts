import m from 'mithril';
import { MeiosisComponent, routingSvc, t } from '../../services';
import { LayoutForm, SlimdownView, UIForm, resolvePlaceholders } from 'mithril-ui-form';
import { Annotation, Pages, Settings } from '../../models';
import { createHighlighter } from '../../utils';
import { FlatButton } from 'mithril-materialized';
import { handleSelection } from './sidenav';

export const LabelEditor: MeiosisComponent = () => {
  let markdownTemplate: undefined | string;
  let labelForm: undefined | UIForm<any>;
  let highlighter: undefined | ((data: Record<string, any>) => Record<string, any>);

  return {
    view: ({ attrs: { state, actions } }) => {
      const { settings = {} as Settings } = state;
      const { setAnnotation } = actions;
      if (!markdownTemplate || markdownTemplate !== settings.template) {
        const { highlighters, template, labels } = settings;
        markdownTemplate = template;
        highlighter = highlighters && highlighters.length > 0 ? createHighlighter(highlighters) : undefined;
        try {
          labelForm = settings.labels ? JSON.parse(labels) : undefined;
        } catch {
          labelForm = undefined;
        }
      }
      const { article: data, annotation = {} as Annotation } = state;
      const highlighted = data && highlighter ? highlighter(data) : data;
      const md = markdownTemplate && resolvePlaceholders(markdownTemplate, highlighted);

      return m(
        '#editor.row',
        { style: { textAlign: 'left', marginBottom: '60px' } },
        md
          ? m(SlimdownView, { md })
          : m(
              'p.col.s12',
              `No preview possible - ${
                !data ? 'Please upload JSON data first' : 'Please specify template to render your data'
              }.`,
              data &&
                typeof markdownTemplate === 'undefined' && [
                  m('br'),
                  m(
                    'a',
                    {
                      href: routingSvc.href(Pages.SETTINGS),
                    },
                    'Open settings'
                  ),
                ],
              !data && [
                m('br'),
                m(FlatButton, {
                  label: t('UPLOAD'),
                  onclick: () => handleSelection('import', 'data', actions),
                  iconName: 'upload',
                }),
              ]
            ),
        labelForm
          ? m(LayoutForm<any>, {
              form: labelForm,
              obj: annotation,
              context: [data, settings],
              onchange: async () => {
                if (data && data.leRowId) {
                  await setAnnotation(data.leRowId, annotation);
                }
              },
            })
          : m('p.col.s12', 'No annotation labels provided')
      );
    },
  };
};
