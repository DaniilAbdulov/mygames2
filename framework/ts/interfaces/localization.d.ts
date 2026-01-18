type Key = string;
type Lang = string;
type MultipleLocales = Record<Lang, string>;

interface SingleLocale {
  key: Key;
  value: string;
  lang: Lang;
}

declare interface ILocalization {
  getLocalizations(keys: Key[], type?: 'object'): Promise<Record<Key, MultipleLocales>>;
  getLocalizations(keys: Key[], type?: 'array'): Promise<SingleLocale[]>;
  getLocalizations(keys: Key[], type?: string): Promise<unknown>;
  
  translateText(text: string): Promise<string>;

  translateTextInLang(text: string, lang: Lang): Promise<string>;
}

export = ILocalization;