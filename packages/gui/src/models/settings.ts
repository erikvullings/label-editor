import { UIForm } from 'mithril-ui-form';
import { Annotator, ID } from '.';
import { i18n } from '../services';

export const LANGUAGE = 'SG_LANGUAGE';
export const SAVED = 'SG_MODEL_SAVED';

export const setLanguage = async (locale = i18n.currentLocale) => {
  localStorage.setItem(LANGUAGE, locale);
  await i18n.loadAndSetLocale(locale);
};

export type Highlighter = {
  type: 'regex' | 'string' | 'transform'; // | 'stem';
  /** Regex or string value to match */
  value: string | RegExp;
  /** Replacement string */
  replace?: string;
  /** Color to use for the label */
  color: string;
  /** Applies to properties */
  properties: string[];
};

export type Settings = {
  /** Data ID to retreive data from the IndexedDB */
  dataId: string;
  /** If true, settings have been loaded from DB */
  loaded?: boolean;
  /** List of all annotators */
  annotators: Annotator[];
  /** Current annotator */
  annotator: ID;
  /** Markdown template to convert the raw data to a Markdown view */
  template: string;
  /** Highlighters to highlight entries in the text */
  highlighters: Highlighter[];
  /** Stringified Mithril UI Form object to add labels */
  labelsStr: string;
  /** Mithril UI Form object to add labels */
  labels: UIForm<UILabel>;
};

type UILabel = {
  id: string;
  repeat?: boolean;
  type?: string | UIForm<UILabel> | any;
  label?: string;
  index?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  description?: string;
  className?: string;
  multiple?: boolean;
  checkboxClass?: string;
  show?: string;
  required?: boolean;
  options?: Array<{ id: string; label: string }>;
};

export const labelGeneratorForm = [
  {
    id: 'repeat',
    label: 'Is group',
    type: 'switch',
    className: 'col s3',
  },
  {
    id: 'id',
    label: 'Label ID',
    required: true,
    placeholder: 'Identifier in the output',
    type: 'text',
    className: 'col s3',
  },
  { id: 'label', label: 'Label', type: 'text', className: 'col s6' },
  {
    id: 'required',
    label: 'Required',
    type: 'switch',
    value: 'true',
    left: 'No',
    right: 'Yes',
    className: 'col s3',
  },
  {
    id: 'multiple',
    label: 'Multiple',
    type: 'switch',
    className: 'col s4',
    show: ['type=select', 'type=options'],
  },
  {
    id: 'type',
    label: 'Type of Label',
    type: 'select',
    required: true,
    show: ['!repeat', 'repeat=false'],
    className: 'col s4',
    options: [
      { id: 'text', label: 'Single line of text' },
      { id: 'number', label: 'A numeric value' },
      { id: 'none', label: 'Hidden property' },
      { id: 'link', label: 'A link' },
      { id: 'email', label: 'An email address' },
      { id: 'textarea', label: 'Text area' },
      { id: 'checkbox', label: 'Single checkbox option' },
      { id: 'radio', label: 'Single radio option' },
      { id: 'select', label: 'Drop down option(s)' },
      { id: 'options', label: 'Checkbox option(s)' },
      { id: 'rating', label: 'Numeric rating' },
    ],
  },

  {
    id: 'checkboxClass',
    label: 'Option layout',
    type: 'text',
    className: 'col s4',
    placeholder: 'col s4',
    show: ['type=radio', 'type=options'],
  },

  {
    id: 'min',
    label: 'Min',
    placeholder: 'Min value/length',
    type: 'number',
    className: 'col s2',
  },
  {
    id: 'max',
    label: 'Max',
    placeholder: 'Max value/length',
    type: 'number',
    className: 'col s2',
  },
  { id: 'placeholder', label: 'Placeholder', type: 'text', className: 'col s4', show: ['repeat=false'] },
  { id: 'description', label: 'Help text', type: 'text', className: 'col s4', show: ['repeat=false'] },
  {
    id: 'className',
    label: 'Layout instructions',
    type: 'text',
    placeholder: 'col s12',
    className: 'col s4',
    description: 'See [Materialize-CSS](https://materializecss.com/grid.html).',
    show: ['repeat=false', '!repeat'],
  },
  {
    id: 'show',
    label: 'Conditions (OR)',
    type: 'tags',
    placeholder: 'E.g. id=value',
    className: 'col s5',
  },
  {
    id: 'options',
    label: 'Options',
    className: 'col s12',
    show: ['type=select', 'type=options', 'type=radio', 'type=rating'],
    repeat: true,
    pageSize: 100,
    required: true,
    type: [
      { id: 'id', label: 'Option ID', type: 'text', className: 'col s4' },
      { id: 'label', label: 'Label', type: 'text', className: 'col s8' },
    ],
  },
] as UIForm<UILabel>;

labelGeneratorForm.push({
  id: 'type',
  label: 'Sub-labels',
  show: ['repeat=true'],
  repeat: true,
  pageSize: 1,
  type: labelGeneratorForm as UIForm<any>,
});

// export const SettingsForm = (annotators: Annotator[] = [], allPropertyKeys: Option<string>[] = []) =>
//   [
//     // {
//     //   id: 'template',
//     //   type: 'textarea',
//     //   label: 'Template',
//     //   placeholder:
//     //     'Markdown template to convert the raw data to a HTML view. Use {{PLACEHOLDER}} to use object properties.',
//     // },
//     // {
//     //   id: 'labels',
//     //   label: 'New label',
//     //   repeat: true,
//     //   pageSize: 1,
//     //   type: labelGeneratorForm,
//     // },
//     // {
//     //   id: 'labelsStr',
//     //   type: 'textarea',
//     //   label: 'Annotation label template (JSON array)',
//     //   placeholder: 'Mithril-UI-form template to create an annotation object.',
//     // },
//     {
//       id: 'annotator',
//       options: annotators,
//       label: 'Current annotator',
//       // show: ['annotators'],
//     },
//     {
//       id: 'annotators',
//       repeat: true,
//       pageSize: 1,
//       type: [
//         { id: 'id', label: 'Initials', type: 'text', className: 'col s4 m3 l2' },
//         { id: 'label', label: 'Name', type: 'text', className: 'col s8 m9 l10' },
//         { id: 'email', label: 'E-mail', type: 'email' },
//       ],
//       label: 'Annotators',
//     },
//     {
//       id: 'highlighters',
//       label: 'Highlighters',
//       repeat: true,
//       pageSize: 1,
//       type: [
//         {
//           id: 'type',
//           label: 'Type',
//           type: 'select',
//           className: 'col s4 m3',
//           options: [
//             { id: 'regex', label: 'Regex' },
//             { id: 'string', label: 'String' },
//             { id: 'transform', label: 'Transform' },
//           ],
//         },
//         { id: 'value', show: ['type!=transform'], label: 'Value', className: 'col s8 m9', type: 'text' },
//         { id: 'value', show: ['type=transform'], label: 'Match', className: 'col s4 m5', type: 'text' },
//         { id: 'replace', show: ['type=transform'], label: 'Replace', className: 'col s4 m4', type: 'text' },
//         {
//           id: 'properties',
//           label: 'Select properties',
//           type: 'select',
//           className: 'col s9 m10',
//           multiple: true,
//           description: 'Apply highlighter to selected object properties that are used in your template',
//           options: allPropertyKeys,
//         },
//         { id: 'color', label: 'Color', className: 'col s3 m2', type: 'color', show: ['type!=transform'] },
//       ],
//     },
//   ] as UIForm<Settings>;
