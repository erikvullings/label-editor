import { messages } from '.';

const aboutMd = ``;

export const messagesNL: typeof messages = {
  HOME: { TITLE: 'home', ROUTE: '/home' },
  ABOUT: { TITLE: 'over de app', ROUTE: '/over', BODY: aboutMd },
  SETTINGS: { TITLE: 'Instellingen', ROUTE: '/instellingen' },
  LANDING: { TITLE: 'Introductie', ROUTE: '/' },
  USER: 'Gebruiker',
  EDITOR: 'Editor',
  ADMIN: 'Administrator',
  CANCEL: 'Afbreken',
  DELETE: 'Verwijderen',
  YES: 'Ja',
  NO: 'Nee',
  OK: 'Ok',
  NAME: 'Naam',
  DESCRIPTION: 'Omschrijving',
  DELETE_ITEM: {
    TITLE: 'Verwijder {item}',
    DESCRIPTION: 'Weet u zeker dat u de {item} wilt verwijderen? Dit kan niet ongedaan gemaakt worden.',
  },
  SAVE_BUTTON: {
    LABEL: 'Opslaan',
    TOOLTIP: 'Sla aanpassingen op',
  },
  SEARCH: 'Zoek...',
  SEARCH_TOOLTIP: 'Type / om te zoeken',
  LANGUAGE: 'Taal',
  CLEAR: 'Wis model',
  UPLOAD: 'Lees model in als JSON',
  DOWNLOAD: 'Sla model op als JSON',
  PERMALINK: 'Maak link',
  ROLE: 'Rol',
  MODEL: 'Model',
  TITLE: 'Titel',
  AUTHORS: 'Auteurs',
  LINK: 'Link',
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
