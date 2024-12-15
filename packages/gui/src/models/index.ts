export * from './page';
export * from './settings';
export * from './data-model';

export interface ILokiObj {
  id: number;
}

export type ID = string;

export type Annotator = { id: ID; name: string; email?: string };

export type Annotation = Record<string, any> & {
  annotator?: Annotator;
  /** Last annotation date */
  date: number;
};
