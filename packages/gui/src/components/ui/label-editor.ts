import m from 'mithril';
import { MeiosisComponent, routingSvc } from '../../services';
import { LayoutForm, SlimdownView, UIForm, resolvePlaceholders } from 'mithril-ui-form';
import { Annotation, Pages, Settings } from '../../models';
import { createHighlighter } from '../../utils';

export const LabelEditor: MeiosisComponent = () => {
  let markdownTemplate: undefined | string;
  let labelForm: undefined | UIForm<any>;
  let highlighter: undefined | ((data: Record<string, any>) => Record<string, any>);

  let dummy: Record<string, any> = {};

  return {
    view: ({ attrs: { state, actions } }) => {
      const { settings = {} as Settings, annotator, page } = state;
      // console.log(settings);
      const { setAnnotation } = actions;
      if (!markdownTemplate || markdownTemplate !== settings.template) {
        const { highlighters, template, labelsStr, labels } = settings;
        markdownTemplate = template;
        highlighter = highlighters && highlighters.length > 0 ? createHighlighter(highlighters) : undefined;
        try {
          labelForm = labels ? labels : labelsStr ? JSON.parse(labelsStr) : undefined;
        } catch {
          labelForm = undefined;
        }
      }
      const { article: data, annotation = {} as Annotation } = state;
      const highlighted = data && highlighter ? highlighter(data) : data;
      const md = markdownTemplate && highlighted ? resolvePlaceholders(markdownTemplate, highlighted) : '';

      const context = [data, { annotator }];
      return m(
        '#editor.row',
        { style: { textAlign: 'left', marginBottom: '60px' } },
        labelForm
          ? m(LayoutForm<any>, {
              form: labelForm,
              obj: page === Pages.SETTINGS ? dummy : annotation,
              context,
              onchange:
                page === Pages.SETTINGS
                  ? undefined
                  : async () => {
                      if (data && data[settings.dataId]) {
                        await setAnnotation(data[settings.dataId], annotation);
                      }
                    },
            })
          : data && m('p.col.s12', 'No annotation labels provided'),
        md
          ? m(SlimdownView, { md, externalLinks: true })
          : m(
              'p.col.s12.center-align',
              `No preview possible - ${
                !data ? 'Please use the menu to upload data first' : 'Please specify template to render your data'
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
                ]
            )
      );
    },
  };
};
