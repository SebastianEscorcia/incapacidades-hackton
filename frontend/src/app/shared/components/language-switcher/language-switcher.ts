import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import type { AppLanguage } from '../../../core/i18n/i18n.types';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="language-switcher" role="group" [attr.aria-label]="'common.language' | translate">
      @for (language of i18n.languages; track language.code) {
        <button
          type="button"
          class="language-option"
          [class.active]="i18n.language() === language.code"
          (click)="setLanguage(language.code)"
        >
          <span
            class="flag"
            [class.flag-en]="language.code === 'en'"
            [class.flag-es]="language.code === 'es'"
          ></span>
          <span>{{ language.label }}</span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .language-switcher {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        border: 1px solid #dbe3ef;
        border-radius: 999px;
        padding: 0.25rem;
        background: #f8fafc;
      }

      .language-option {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        border: 0;
        border-radius: 999px;
        padding: 0.35rem 0.625rem;
        color: #334155;
        background: transparent;
        cursor: pointer;
        font: inherit;
      }

      .language-option.active {
        color: #111827;
        background: #ffffff;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
      }

      .flag {
        width: 1.25rem;
        height: 0.875rem;
        border-radius: 0.125rem;
        box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.18);
        overflow: hidden;
      }

      .flag-es {
        background: linear-gradient(to bottom, #aa151b 0 25%, #f1bf00 25% 75%, #aa151b 75% 100%);
      }

      .flag-en {
        background:
          linear-gradient(90deg, transparent 0 42%, #c8102e 42% 58%, transparent 58% 100%),
          linear-gradient(0deg, transparent 0 38%, #c8102e 38% 62%, transparent 62% 100%),
          linear-gradient(90deg, transparent 0 35%, #ffffff 35% 65%, transparent 65% 100%),
          linear-gradient(0deg, transparent 0 30%, #ffffff 30% 70%, transparent 70% 100%), #012169;
      }
    `,
  ],
})
export class LanguageSwitcher {
  protected readonly i18n = inject(I18nService);

  setLanguage(language: AppLanguage): void {
    this.i18n.setLanguage(language);
  }
}
