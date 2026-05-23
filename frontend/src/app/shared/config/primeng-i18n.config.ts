import type { AppLanguage } from '../../core/i18n/i18n.types';
import { PRIMENG_ES } from './primeng-es.config';

export const PRIMENG_EN = {};

export const PRIMENG_TRANSLATIONS: Record<AppLanguage, Record<string, unknown>> = {
  en: PRIMENG_EN,
  es: PRIMENG_ES,
};
