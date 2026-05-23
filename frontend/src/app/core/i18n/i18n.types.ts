export type AppLanguage = 'en' | 'es';

export type TranslationParams = Record<string, string | number>;

export type TranslationValue = string | TranslationDictionary;

export interface TranslationDictionary {
  [key: string]: TranslationValue;
}

export interface AppLanguageOption {
  code: AppLanguage;
  label: string;
  locale: string;
}
