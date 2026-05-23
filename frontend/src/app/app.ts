import { Component, effect, inject } from '@angular/core';
import { PrimeNG } from 'primeng/config';
import { I18nService } from './core/i18n/i18n.service';
import { PRIMENG_TRANSLATIONS } from './shared/config/primeng-i18n.config';

import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class App {
  private primeng = inject(PrimeNG);
  private i18n = inject(I18nService);

  constructor() {
    effect(() => {
      this.primeng.setTranslation(PRIMENG_TRANSLATIONS[this.i18n.language()]);
    });
  }
}
