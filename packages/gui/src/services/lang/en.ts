import { jsonp } from 'mithril';

const aboutMd = `# About Label Editor

A standalone in-browser alternative to applications as [LABEL-STUDIO](https://labelstud.io/). It allows you to upload data in your browser (using the browser's internal IndexDB database for storage), specify your own Markdown-based template to display the data (rendered using [slimdown-js](https://github.com/erikvullings/slimdown-js)), and create your own annotations format by using a JSON template based on [mithril-ui-form](https://github.com/erikvullings/mithril-ui-form).

## Process

The labelling process is as follows:

1. Import data: this deletes the current database, so please save any old annotations that you have made.
2. Specify unique ID, and optional title, text body and URL keys.
3. Import or create your own settings, consisting of a Markdown template, a JSON template for your annotation object, and optional text highlighters or converters.
4. Start labelling.

## Markdown Template

You can specify your own markdown template to render your data. It treats your template as [Markdown](https://www.markdownguide.org/cheat-sheet/), and all data keys inside double accolades are resolved from the data. For example, if your data object has a \`title\` property, \`# title\` will convert it to a header 1 level title.

Upon importing, you can select several keys for title, text body and URL.

## JSON template

The JSON template allows you to create any annotation object that you require. You can see several examples [here](https://erikvullings.github.io/mithril-ui-form/#!/home), but the basic concept is quite simple. Each annotation property is specified using a simple data object. For example, to create labels for the amount of money found in an article, you can use the following template:

<code>
[
  { "id": "amount", "label": "Amount of money", "type": "number", "className": "col s6" },
  { "id": "currency", "label": "Currency", "type": "text", "className": "col s6" }    
]
</code>

## Highlighters and transformers

To highlight text, you can specify a highlighter using plain text or regular expressions. In addition, you can specify a transformer that replaces found regular expression patterns using substitution, e.g. a value of "(\d+)" and a replace of "EUR $1" will add "EUR" before each number. Note that the transformers are applied first. To exercise with regular expressions, visit [Regex101](https://regex101.com/), which also offers a list of [community patterns](https://regex101.com/library).
`;

export const messages = {
  HOME: { TITLE: 'home', ROUTE: '/home' },
  ABOUT: { TITLE: 'About', ROUTE: '/about', BODY: aboutMd },
  SETTINGS: { TITLE: 'Settings', ROUTE: '/settings' },
  LANDING: { TITLE: 'Introduction', ROUTE: '/' },
  USER: 'User',
  EDITOR: 'Editor',
  ADMIN: 'Administrator',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  YES: 'Yes',
  NO: 'No',
  OK: 'Ok',
  NAME: 'Name',
  DESCRIPTION: 'Description',
  DELETE_ITEM: {
    TITLE: 'Delete {item}',
    DESCRIPTION: 'Are you certain you want to delete this {item}. There is no turning back?',
  },
  SAVE_BUTTON: {
    LABEL: 'Save',
    TOOLTIP: 'Save unsaved changes',
  },
  SEARCH: 'Search...',
  SEARCH_TOOLTIP: 'Type / to search',
  LANGUAGE: 'Language',
  CLEAR: 'Clear model',
  UPLOAD: 'Upload JSON data',
  DOWNLOAD: 'Download model as JSON',
  PERMALINK: 'Create permanent link',
  ROLE: 'Role',
  LINK: 'Link',
  MODEL: 'Model',
  TITLE: 'Title',
  AUTHORS: 'Authors',
  TYPE: 'Type',
  IMPORT: 'Import',
  EXPORT: 'Export',
  DATA: 'DATA',
  ANNOTATION: { 1: 'Annotation', n: 'Annotations' },
  HITS: {
    1: '1 hit',
    n: '{n} hits',
  },
};
