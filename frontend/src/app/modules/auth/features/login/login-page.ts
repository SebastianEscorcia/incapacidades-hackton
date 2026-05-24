import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { registerAuthTranslations } from '../../translations/auth-translations';
import { AuthShell } from '../../../../shared/components/auth-shell/auth-shell';
import { PrimeNGModules } from '@/shared/lib/primeng.module';

@Component({
  selector: 'login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, AuthShell, PrimeNGModules],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    registerAuthTranslations(this.i18n);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
    }
  }
}
