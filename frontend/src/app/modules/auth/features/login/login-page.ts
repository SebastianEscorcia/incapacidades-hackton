import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LanguageSwitcher } from '../../../../shared/components/language-switcher/language-switcher';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    LanguageSwitcher,
    PrimeNGModules  
  ],
  template: `
    <main class="auth-page">
      <section class="auth-card">
        <div class="brand-row">
            <div class="brand-mark">{{ appName.charAt(0) }}</div>
            <div>
              <strong>{{ appName }}</strong>
          </div>
        </div>

        <div class="language-area"><app-language-switcher /></div>

        <div class="card-heading">
          <span class="icon"><i class="pi pi-user"></i></span>
          <div>
            <h1>{{ 'pages.auth' | translate }}</h1>
            <p>{{ 'pages.loginDescription' | translate }}</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <div class="field">
            <p-floatLabel>
              <input id="email" type="email" pInputText formControlName="email" />
              <label for="email">Correo electrónico</label>
            </p-floatLabel>
            <small class="error" *ngIf="form.controls.email.invalid && form.controls.email.touched">
              Ingrese un correo válido.
            </small>
          </div>
          <div class="field">
            <p-floatLabel>
              <p-password
                inputId="password"
                formControlName="password"
                [feedback]="false"
                [toggleMask]="true"
                inputStyleClass="w-full"
              />
              <label for="password">Contraseña</label>
            </p-floatLabel>
            <small
              class="error"
              *ngIf="form.controls.password.invalid && form.controls.password.touched"
            >
              La contraseña es requerida.
            </small>
          </div>
          <p-button type="submit" [disabled]="form.invalid" styleClass="submit-button">
            <i class="pi pi-sign-in"></i>
            <span>{{ 'auth.loginAction' | translate }}</span>
          </p-button>
        </form>

        <div class="secondary-actions">
          <a routerLink="/auth/forgot-password">¿Olvidaste la contraseña?</a>
          <a routerLink="/auth/register">Crear cuenta</a>
          <a routerLink="/public">Volver al inicio</a>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
      .auth-page {
        display: grid;
        place-items: center;
        min-height: 100vh;
        padding: 1.25rem;
        background: #f8fafc;
        color: #111827;
      }
      .auth-card {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 1.2rem;
        width: min(100%, 30rem);
        border: 1px solid #e2e8f0;
        border-radius: 2rem;
        background: #fff;
        padding: clamp(1.5rem, 4vw, 2.65rem);
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
      }
      .brand-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.65rem;
        text-align: center;
      }
      .brand-mark {
        display: grid;
        place-items: center;
        width: 3rem;
        height: 3rem;
        border-radius: 1rem;
        background: #2563eb;
        color: #fff;
        font-size: 1.35rem;
        font-weight: 900;
      }
      .brand-row strong,
      .brand-row span {
        display: block;
      }
      .brand-row strong {
        color: #111827;
        font-size: 1.2rem;
        letter-spacing: 0;
      }
      .brand-row span {
        color: #64748b;
        font-size: 0.875rem;
      }
      .language-area {
        display: flex;
        justify-content: center;
      }
      .card-heading {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: center;
        text-align: center;
      }
      .icon {
        display: grid;
        place-items: center;
        width: 3rem;
        height: 3rem;
        border-radius: 0.875rem;
        color: #fff;
        background: #0f766e;
      }
      h1 {
        margin: 0;
        color: #111827;
        font-size: 1.65rem;
      }
      p {
        margin: 0.35rem 0 0;
        color: #64748b;
        line-height: 1.5;
      }
      .form {
        display: grid;
        gap: 1.25rem;
      }
      .field {
        display: grid;
        gap: 0.4rem;
      }
      .error {
        color: #dc2626;
        font-size: 0.8125rem;
      }
      :host ::ng-deep .submit-button {
        display: inline-flex;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        border-radius: 999px;
        padding: 0.85rem 1rem;
      }
      :host ::ng-deep .p-inputtext,
      :host ::ng-deep .p-password,
      :host ::ng-deep .p-password-input {
        width: 100%;
      }
      .secondary-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
      }
      .secondary-actions a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.65rem;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        background: #fff;
        color: #1e293b;
        font-weight: 800;
        text-align: center;
        text-decoration: none;
      }
      .secondary-actions a:hover {
        border-color: #2563eb;
        color: #2563eb;
      }
      @media (max-width: 420px) {
        .secondary-actions {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly appName = environment.app_name;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
  }
}
