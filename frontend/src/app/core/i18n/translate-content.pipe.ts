import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
  name: 'translateContent',
  standalone: true,
  pure: false,
})
export class TranslateContentPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(text: string): string {
    return this.i18n.translateContent(text);
  }
}
