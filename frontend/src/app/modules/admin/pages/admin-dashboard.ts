import { Component } from '@angular/core';
import { TranslateContentPipe } from '../../../core/i18n/translate-content.pipe';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'admin-dashboard',
  imports: [TranslateContentPipe, TranslatePipe],
  template: `
    <section class="dashboard admin">
      <header class="page-header">
        <span class="eyebrow">Administration</span>
        <h1>{{ 'pages.dashboard' | translate }}</h1>
        <p>{{ 'pages.dashboardDescription' | translate }}</p>
      </header>

      <div class="metrics">
        <article>
          <span>Users</span>
          <strong>1,248</strong>
          <small>Active accounts</small>
        </article>
        <article>
          <span>Roles</span>
          <strong>8</strong>
          <small>Permission groups</small>
        </article>
        <article>
          <span>Health</span>
          <strong>99%</strong>
          <small>System status</small>
        </article>
      </div>

      <div class="workspace">
        <article class="panel primary">
          <div>
            <span class="panel-label">Admin workflow</span>
            <h2>System control center</h2>
            <p>
              Use this area as the starting point for user management, permissions, audit logs and
              core configuration.
            </p>
          </div>
          <div class="steps">
            <span>Review new users</span>
            <span>Validate permissions</span>
            <span>Monitor system events</span>
          </div>
        </article>

        <article class="panel secondary">
          <span class="panel-label">Today</span>
          <h2>Pending actions</h2>
          <ul>
            <li>Approve invited users</li>
            <li>Review failed API requests</li>
            <li>Update access policies</li>
          </ul>
        </article>
      </div>
      <article class="insight">
        <span class="panel-label">Database content</span>
        <p>{{ databaseContent | translateContent }}</p>
      </article>
    </section>
  `,
  styles: [
    `
      .dashboard {
        display: grid;
        gap: 1rem;
        color: #111827;
      }
      .page-header,
      .metrics article,
      .panel,
      .insight {
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        background: #fff;
        box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
      }
      .page-header {
        padding: 1.5rem;
      }
      .eyebrow,
      .panel-label {
        color: var(--accent);
        font-size: 0.75rem;
        font-weight: 900;
        text-transform: uppercase;
      }
      h1,
      h2,
      p {
        margin: 0;
      }
      h1 {
        margin-top: 0.5rem;
        font-size: 2rem;
      }
      h2 {
        margin: 0.45rem 0;
        font-size: 1.25rem;
      }
      p,
      small,
      li {
        color: #64748b;
        line-height: 1.6;
      }
      .admin {
        --accent: #2563eb;
      }
      .enterprise {
        --accent: #7c3aed;
      }
      .customers {
        --accent: #0f766e;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }
      .metrics article {
        padding: 1.1rem;
      }
      .metrics span,
      .metrics small {
        display: block;
      }
      .metrics strong {
        display: block;
        margin: 0.3rem 0;
        font-size: 1.8rem;
      }
      .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
        gap: 1rem;
      }
      .panel,
      .insight {
        padding: 1.25rem;
      }
      .primary {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(220px, 0.6fr);
        gap: 1rem;
        align-items: center;
      }
      .steps {
        display: grid;
        gap: 0.65rem;
      }
      .steps span {
        border-left: 4px solid var(--accent);
        border-radius: 0.45rem;
        background: #f8fafc;
        padding: 0.75rem;
        color: #334155;
        font-weight: 700;
      }
      ul {
        display: grid;
        gap: 0.75rem;
        margin: 1rem 0 0;
        padding-left: 1.1rem;
      }
      @media (max-width: 900px) {
        .metrics,
        .workspace,
        .primary {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminDashboard {
  protected readonly databaseContent =
    'Este contenido simula un texto que viene desde la base de datos en español.';
}
