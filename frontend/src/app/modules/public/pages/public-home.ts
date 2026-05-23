import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageSwitcher } from '../../../shared/components/language-switcher/language-switcher';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'public-home',
  imports: [RouterLink, TranslatePipe, LanguageSwitcher],
  template: `
    <main class="landing">
      <header class="nav">
        <a class="brand" routerLink="/public">
          <span>{{ appName.charAt(0) }}</span>
          <strong>{{ appName }}</strong>
        </a>
        <div class="nav-actions">
          <app-language-switcher />
          <a class="outline-link" routerLink="/auth/login">Login</a>
          <a class="solid-link" routerLink="/auth/register">Start</a>
        </div>
      </header>

      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">SaaS starter</span>
          <h1>{{ 'app.title' | translate }}</h1>
          <p>{{ 'pages.publicDescription' | translate }}</p>
          <div class="hero-actions">
            <a class="solid-link" routerLink="/auth/login">Ir al login</a>
            <a class="outline-link" routerLink="/auth/register">Crear cuenta</a>
          </div>
        </div>
        <div class="product-preview" aria-label="Dashboard preview">
          <div class="preview-top">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="preview-grid">
            <article>
              <small>MRR</small>
              <strong>$42.8k</strong>
            </article>
            <article>
              <small>Clients</small>
              <strong>1,284</strong>
            </article>
            <article class="wide">
              <small>Conversion pipeline</small>
              <div class="bars"><span></span><span></span><span></span><span></span></div>
            </article>
          </div>
        </div>
      </section>

      <section class="features">
        <article>
          <i class="pi pi-lock"></i>
          <h2>Auth flow</h2>
          <p>Login, register, recovery and route examples wired as standalone pages.</p>
        </article>
        <article>
          <i class="pi pi-sitemap"></i>
          <h2>Modular routing</h2>
          <p>Public, admin, enterprise and customers modules can be enabled as needed.</p>
        </article>
        <article>
          <i class="pi pi-language"></i>
          <h2>i18n ready</h2>
          <p>Manual translation utilities are included when multilingual mode is selected.</p>
        </article>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f8fafc;
        color: #111827;
      }
      .landing {
        width: min(1180px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 1rem 0 3rem;
      }
      .nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 4.5rem;
      }
      .brand,
      .nav-actions,
      .hero-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .brand {
        color: #111827;
        text-decoration: none;
      }
      .brand span {
        display: grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.75rem;
        background: #2563eb;
        color: #fff;
        font-weight: 900;
      }
      .solid-link,
      .outline-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.65rem;
        border-radius: 999px;
        padding: 0 1rem;
        font-weight: 800;
        text-decoration: none;
      }
      .solid-link {
        border: 1px solid #2563eb;
        background: #2563eb;
        color: #fff;
      }
      .outline-link {
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #1e293b;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.85fr);
        gap: 2rem;
        align-items: center;
        min-height: calc(100vh - 7rem);
        padding: 2rem 0;
      }
      .hero-copy {
        max-width: 680px;
      }
      .eyebrow {
        color: #0f766e;
        font-size: 0.8rem;
        font-weight: 900;
        text-transform: uppercase;
      }
      h1 {
        margin: 0.65rem 0 1rem;
        font-size: clamp(2.75rem, 7vw, 5.7rem);
        line-height: 0.95;
      }
      p {
        margin: 0;
        color: #475569;
        line-height: 1.7;
      }
      .hero-copy p {
        max-width: 620px;
        font-size: 1.1rem;
      }
      .hero-actions {
        margin-top: 1.5rem;
        flex-wrap: wrap;
      }
      .product-preview {
        border: 1px solid #dbeafe;
        border-radius: 1.25rem;
        background: #fff;
        padding: 1rem;
        box-shadow: 0 28px 80px rgba(15, 23, 42, 0.14);
      }
      .preview-top {
        display: flex;
        gap: 0.45rem;
        padding-bottom: 1rem;
      }
      .preview-top span {
        width: 0.7rem;
        height: 0.7rem;
        border-radius: 999px;
        background: #cbd5e1;
      }
      .preview-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
      }
      .preview-grid article,
      .features article {
        border: 1px solid #e2e8f0;
        border-radius: 0.85rem;
        background: #f8fafc;
        padding: 1rem;
      }
      .preview-grid .wide {
        grid-column: 1 / -1;
      }
      small {
        color: #64748b;
        font-weight: 800;
        text-transform: uppercase;
      }
      strong {
        display: block;
        margin-top: 0.35rem;
        font-size: 2rem;
      }
      .bars {
        display: grid;
        gap: 0.55rem;
        margin-top: 0.8rem;
      }
      .bars span {
        display: block;
        height: 0.7rem;
        border-radius: 999px;
        background: #2563eb;
      }
      .bars span:nth-child(2) {
        width: 82%;
        background: #0f766e;
      }
      .bars span:nth-child(3) {
        width: 64%;
        background: #f59e0b;
      }
      .bars span:nth-child(4) {
        width: 44%;
        background: #64748b;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }
      .features article {
        background: #fff;
      }
      .features i {
        color: #2563eb;
        font-size: 1.5rem;
      }
      .features h2 {
        margin: 0.85rem 0 0.35rem;
        font-size: 1.05rem;
      }
      @media (max-width: 860px) {
        .nav,
        .nav-actions {
          align-items: flex-start;
          flex-direction: column;
        }
        .hero,
        .features {
          grid-template-columns: 1fr;
        }
        .hero {
          min-height: auto;
        }
      }
    `,
  ],
})
export class PublicHome {
  readonly appName = environment.app_name;
}
