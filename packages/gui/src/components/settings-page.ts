import m from 'mithril';
import { Pages, Settings, SettingsForm } from '../models';
import { MeiosisComponent } from '../services';
import { FormAttributes, LayoutForm, UIForm } from 'mithril-ui-form';
import { createHighlighter, extractPropertyKeys } from '../utils';
import { Option } from 'mithril-materialized';
import { LabelEditor } from './ui/label-editor';

export const SettingsPage: MeiosisComponent = () => {
  let allPropertyKeys: Option<string>[] = [];
  let highlighter: undefined | ((data: Record<string, any>) => Record<string, any>);
  let labelForm: undefined | UIForm<any>;
  let labelFormParseError: undefined | string;
  let labels = {};

  return {
    oninit: async ({
      attrs: {
        state: { article: data },
        actions: { setPage, refreshData },
      },
    }) => {
      if (typeof data === 'undefined') {
        await refreshData(1);
      }
      setPage(Pages.SETTINGS);
    },
    view: ({ attrs }) => {
      const { state, actions } = attrs;
      const { settings = {} as Settings, article: data } = state;
      // data = await fetchData(1, 3);
      if (data) {
        allPropertyKeys = extractPropertyKeys(data).map((id) => ({ id, label: id }));
        // console.log(allPropertyKeys);
      }

      const { highlighters } = settings;
      highlighter = highlighters && highlighters.length > 0 ? createHighlighter(highlighters) : undefined;

      try {
        labelForm = settings.labels ? JSON.parse(settings.labels) : undefined;
        settings.labels = JSON.stringify(labelForm, null, 2);
        labelFormParseError = undefined;
      } catch (e: any) {
        labelFormParseError = e.toString();
        labelForm = undefined;
      }

      return m(
        '#settings-page.settings.page.row',
        m(
          '.col.s12.m6',
          m(LayoutForm, {
            form: SettingsForm(settings.annotators, allPropertyKeys),
            obj: settings,
            // context: [{ allPropertyKeys }],
            onchange: async () => {
              await actions.saveSettings(settings);
            },
          } as FormAttributes<Settings>)
        ),
        m(
          '.col.s12.m6',
          m(LabelEditor, attrs),
          m(
            '.row',
            Object.keys(labels).length > 0
              ? m('pre.col.s12', JSON.stringify(labels, null, 2))
              : m('pre.col.s12', 'No label set')
          )
        ),

        m('pre.col.s12', JSON.stringify(data, null, 2))
      );
    },
  };
};
