import { computed, Injectable, signal } from '@angular/core';
import { APP_LANGUAGE_LOCALES, APP_LANGUAGES, APP_TRANSLATIONS } from './translations';
import type { AppLanguage, TranslationDictionary, TranslationParams } from './i18n.types';

const STORAGE_KEY = 'app-language';
const DEFAULT_LANGUAGE: AppLanguage = 'en';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly languages = APP_LANGUAGES;

  private readonly currentLanguage = signal<AppLanguage>(this.resolveInitialLanguage());
  private readonly contentTranslations = new Map<string, Partial<Record<AppLanguage, string>>>();

  readonly language = this.currentLanguage.asReadonly();
  readonly locale = computed(() => APP_LANGUAGE_LOCALES[this.language()]);

  constructor() {
    this.syncDocumentLanguage(this.language());
  }

  setLanguage(language: AppLanguage): void {
    this.currentLanguage.set(language);
    this.syncDocumentLanguage(language);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, language);
    }
  }

  translate(key: string, params: TranslationParams = {}): string {
    const value = this.readTranslation(key);

    return Object.entries(params).reduce(
      (text, [paramKey, paramValue]) => text.replaceAll(`{{${paramKey}}}`, String(paramValue)),
      value,
    );
  }

  t(key: string, params: TranslationParams = {}): string {
    return this.translate(key, params);
  }

  registerContentTranslation(
    sourceText: string,
    translations: Partial<Record<AppLanguage, string>>,
  ): void {
    this.contentTranslations.set(sourceText.trim(), translations);
  }

  translateContent(sourceText: string): string {
    const normalizedText = sourceText?.trim();

    if (!normalizedText) {
      return sourceText;
    }

    return this.contentTranslations.get(normalizedText)?.[this.language()] ?? sourceText;
  }

  private readTranslation(key: string): string {
    const value = key
      .split('.')
      .reduce<TranslationDictionary | string | undefined>((current, segment) => {
        if (!current || typeof current === 'string') {
          return undefined;
        }

        return current[segment];
      }, APP_TRANSLATIONS[this.language()]);

    return typeof value === 'string' ? value : key;
  }

  private resolveInitialLanguage(): AppLanguage {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    const savedLanguage = localStorage.getItem(STORAGE_KEY);

    return this.isSupportedLanguage(savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE;
  }

  private isSupportedLanguage(language: string | null): language is AppLanguage {
    return language === 'en' || language === 'es';
  }

  private syncDocumentLanguage(language: AppLanguage): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }
}
