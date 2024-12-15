import { UIForm } from 'mithril-ui-form';
import { Annotator, ID } from '.';
import { i18n } from '../services';
import { Option } from 'mithril-materialized';

export const LANGUAGE = 'SG_LANGUAGE';
export const SAVED = 'SG_MODEL_SAVED';

export const setLanguage = async (locale = i18n.currentLocale) => {
  localStorage.setItem(LANGUAGE, locale);
  await i18n.loadAndSetLocale(locale);
};

export type Highlighter = {
  type: 'regex' | 'string'; // | 'stem';
  /** Regex or string value to match */
  value: string | RegExp;
  /** Color to use for the label */
  color: string;
  /** Applies to properties */
  properties: string[];
};

export type Settings = {
  /** List of all annotators */
  annotators: Annotator[];
  /** Current annotator */
  annotator: ID;
  /** Markdown template to convert the raw data to a Markdown view */
  template: string;
  /** Highlighters to highlight entries in the text */
  highlighters: Highlighter[];
  /** Mithril UI Form object to add labels */
  labels: string;
};

export const SettingsForm = (annotators: Annotator[] = [], allPropertyKeys: Option<string>[] = []) =>
  [
    {
      id: 'template',
      type: 'textarea',
      label: 'Template',
      placeholder:
        'Markdown template to convert the raw data to a HTML view. Use {{PLACEHOLDER}} to use object properties.',
    },
    {
      id: 'labels',
      type: 'textarea',
      label: 'Annotation label template (JSON array)',
      placeholder: 'Mithril-UI-form template to create an annotation object.',
    },
    {
      id: 'annotator',
      options: annotators,
      label: 'Current annotator',
      // show: ['annotators'],
    },
    {
      id: 'annotators',
      repeat: true,
      pageSize: 1,
      type: [
        { id: 'id', label: 'Initials', type: 'text', className: 'col s4 m3 l2' },
        { id: 'label', label: 'Name', type: 'text', className: 'col s8 m9 l10' },
        { id: 'email', label: 'E-mail', type: 'email' },
      ],
      label: 'Annotators',
    },
    {
      id: 'highlighters',
      label: 'Highlighters',
      repeat: true,
      pageSize: 1,
      type: [
        {
          id: 'type',
          label: 'Type',
          type: 'select',
          className: 'col s4 m3',
          options: [
            { id: 'regex', label: 'Regex' },
            { id: 'string', label: 'String' },
            // { id: 'stem', label: 'Stem' },
          ],
        },
        { id: 'value', label: 'Value', className: 'col s4 m6', type: 'text' },
        { id: 'color', label: 'Color', className: 'col s4 m3', type: 'color' },
        {
          id: 'properties',
          label: 'Select properties',
          type: 'select',
          multiple: true,
          description: 'Apply highlighter to selected object properties that are used in your template',
          options: allPropertyKeys,
        },
      ],
    },
  ] as UIForm<Settings>;
