import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppLayout } from '@/shared/layout/components/app.layout';
import { WorkflowFlowMockService } from '@shared/workflow/mocks/workflow-flow.mock.service';
import { menuEps } from './const/menu-eps.const';
import { I18nService } from '@/core/i18n/i18n.service';
import { registerEpsTranslations } from '../translations/eps-translations';
import { registerWorkflowTranslations } from '@shared/workflow/translations/workflow-translations';

@Component({
  selector: 'eps-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppLayout],
  template: `<app-layout [menu]="menu()" [showWorkflowTracker]="true" />`,
})
export class EpsLayout implements OnInit {
  private readonly flow = inject(WorkflowFlowMockService);
  private readonly i18n = inject(I18nService);
  protected readonly menu = signal<MenuItem[]>(menuEps);

  constructor() {
    registerEpsTranslations(this.i18n);
    registerWorkflowTranslations(this.i18n);
  }

  ngOnInit(): void {
    this.flow.setActor('eps');
  }
}
