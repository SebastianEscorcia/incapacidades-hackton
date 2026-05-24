import { computed, Injectable, signal } from '@angular/core';
import { APP_LANGUAGE_LOCALES, APP_LANGUAGES, APP_TRANSLATIONS } from './translations';
import type { AppLanguage, TranslationDictionary, TranslationParams } from './i18n.types';

const STORAGE_KEY = 'app-language';
const DEFAULT_LANGUAGE: AppLanguage = 'es';

function isDictionary(value: unknown): value is TranslationDictionary {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeDeep(target: TranslationDictionary, source: TranslationDictionary): TranslationDictionary {
  const output: TranslationDictionary = { ...target };

  Object.entries(source).forEach(([key, sourceValue]) => {
    const targetValue = output[key];

    if (isDictionary(targetValue) && isDictionary(sourceValue)) {
      output[key] = mergeDeep(targetValue, sourceValue);
    } else {
      output[key] = sourceValue;
    }
  });

  return output;
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly languages = APP_LANGUAGES;

  private readonly currentLanguage = signal<AppLanguage>(this.resolveInitialLanguage());
  private readonly contentTranslations = new Map<string, Partial<Record<AppLanguage, string>>>();
  private readonly moduleTranslations: Partial<Record<AppLanguage, TranslationDictionary>> = {};

  readonly language = this.currentLanguage.asReadonly();
  readonly locale = computed(() => APP_LANGUAGE_LOCALES[this.language()]);

  constructor() {
    this.syncDocumentLanguage(this.language());
    this.registerCommonContentTranslations();
  }

  private registerCommonContentTranslations(): void {
    const commonTranslations: Array<{ source: string; en: string; es: string }> = [
      { source: 'En proceso', en: 'In progress', es: 'En proceso' },
      { source: 'Aprobados', en: 'Approved', es: 'Aprobados' },
      { source: 'Glosas', en: 'Claims', es: 'Glosas' },
      { source: 'Rechazados', en: 'Rejected', es: 'Rechazados' },
      { source: 'Recargar incapacidad', en: 'Reload disability document', es: 'Recargar incapacidad' },
      { source: 'Pendiente', en: 'Pending', es: 'Pendiente' },
      { source: 'Fecha inconsistente', en: 'Inconsistent date', es: 'Fecha inconsistente' },
      { source: 'Servicios', en: 'Services', es: 'Servicios' },
      { source: 'Transporte', en: 'Transport', es: 'Transporte' },
      { source: 'Salud', en: 'Health', es: 'Salud' },
      { source: 'Construcción', en: 'Construction', es: 'Construcción' }
    ];

    commonTranslations.forEach((t) => {
      this.registerContentTranslation(t.source, { en: t.en, es: t.es });
    });
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

  registerTranslations(translations: Partial<Record<AppLanguage, TranslationDictionary>>): void {
    Object.entries(translations).forEach(([language, translation]) => {
      if (!this.isSupportedLanguage(language)) {
        return;
      }

      const current = this.moduleTranslations[language] ?? {};
      this.moduleTranslations[language] = mergeDeep(current, translation as TranslationDictionary);
    });
  }

  translateContent(sourceText: string): string {
    const normalizedText = sourceText?.trim();

    if (!normalizedText) {
      return sourceText;
    }

    return this.contentTranslations.get(normalizedText)?.[this.language()] ?? sourceText;
  }

  private readTranslation(key: string): string {
    const translations = this.currentTranslations();

    const value = key
      .split('.')
      .reduce<TranslationDictionary | string | undefined>((current, segment) => {
        if (!current || typeof current === 'string') {
          return undefined;
        }

        return current[segment];
      }, translations);

    return typeof value === 'string' ? value : key;
  }

  private currentTranslations(): TranslationDictionary {
    return mergeDeep(APP_TRANSLATIONS[this.language()], this.moduleTranslations[this.language()] ?? {});
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
