import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'auth-shell',
  standalone: true,
  imports: [CommonModule, LanguageSwitcher, TranslatePipe],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly icon = input<string>('pi pi-user');

  protected readonly appName = () => environment.app_name;
}
