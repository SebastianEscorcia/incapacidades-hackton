import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitchModule],
  template: `
    <div class="language-toggle-wrapper">
      <span
        class="flag-icon flag-es"
        [class.inactive]="isEnglish"
        (click)="setLanguage('es')"
        title="Español"
      ></span>
      <p-toggleswitch [(ngModel)]="isEnglish"></p-toggleswitch>
      <span
        class="flag-icon flag-en"
        [class.inactive]="!isEnglish"
        (click)="setLanguage('en')"
        title="English"
      ></span>
    </div>
  `,
  styles: [
    `
      .language-toggle-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.5rem;
      }

      .flag-icon {
        width: 1.5rem;
        height: 1.05rem;
        border-radius: 3px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
        cursor: pointer;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .flag-icon:hover {
        transform: scale(1.1);
      }

      .flag-icon.inactive {
        opacity: 0.35;
      }

      .flag-es {
        background: linear-gradient(to bottom, #aa151b 0 25%, #f1bf00 25% 75%, #aa151b 75% 100%);
      }

      .flag-en {
        background: linear-gradient(90deg, transparent 0 42%, #c8102e 42% 58%, transparent 58% 100%),
          linear-gradient(0deg, transparent 0 38%, #c8102e 38% 62%, transparent 62% 100%),
          linear-gradient(90deg, transparent 0 35%, #ffffff 35% 65%, transparent 65% 100%),
          linear-gradient(0deg, transparent 0 30%, #ffffff 30% 70%, transparent 70% 100%), #012169;
      }
    `,
  ],
})
export class LanguageSwitcher {
  private readonly i18n = inject(I18nService);

  get isEnglish(): boolean {
    return this.i18n.language() === 'en';
  }

  set isEnglish(value: boolean) {
    this.i18n.setLanguage(value ? 'en' : 'es');
  }

  setLanguage(lang: 'en' | 'es'): void {
    this.i18n.setLanguage(lang);
  }
}
