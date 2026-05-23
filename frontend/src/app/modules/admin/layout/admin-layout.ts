import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageSwitcher } from '../../../shared/components/language-switcher/language-switcher';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe, LanguageSwitcher],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">{{ appName.charAt(0) }}</span>
          <div>
            <strong>{{ appName }}</strong>
            <small>{{ 'app.adminPanel' | translate }}</small>
          </div>
        </div>
        <nav class="nav">
          <a routerLink="./" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span></span>
            {{ 'app.adminPanel' | translate }}
          </a>
        </nav>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <p>Workspace</p>
            <h1>{{ 'app.adminPanel' | translate }}</h1>
          </div>
          <app-language-switcher />
        </header>
        <section class="content">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        min-height: 100vh;
        background: #f8fafc;
        color: #111827;
      }
      .sidebar {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        background: #0f172a;
        color: #e5e7eb;
        padding: 1.25rem;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.25);
      }
      .brand-mark {
        display: grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.75rem;
        background: #2563eb;
        color: #fff;
        font-weight: 800;
      }
      .brand strong,
      .brand small {
        display: block;
      }
      .brand small {
        margin-top: 0.125rem;
        color: #94a3b8;
      }
      .nav {
        display: grid;
        gap: 0.375rem;
      }
      .nav a {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        border-radius: 0.5rem;
        padding: 0.75rem;
        color: #cbd5e1;
        text-decoration: none;
      }
      .nav a span {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 999px;
        background: #38bdf8;
      }
      .nav a.active,
      .nav a:hover {
        background: rgba(255, 255, 255, 0.09);
        color: #fff;
      }
      .main {
        min-width: 0;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 5rem;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        background: #fff;
      }
      .topbar p {
        margin: 0 0 0.25rem;
        color: #64748b;
        font-size: 0.8125rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .topbar h1 {
        margin: 0;
        font-size: 1.5rem;
      }
      .content {
        padding: 1.5rem;
      }
      @media (max-width: 780px) {
        .shell {
          grid-template-columns: 1fr;
        }
        .sidebar {
          position: static;
        }
        .topbar {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class AdminLayout {
  readonly appName = environment.app_name;
}
