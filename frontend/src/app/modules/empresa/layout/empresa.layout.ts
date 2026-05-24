import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppLayout } from '@/shared/layout/components/app.layout';
import { WorkflowFlowService } from '@shared/workflow/services/workflow-flow.service';
import { menuEmpresa } from './const/menu-empresa.const';
import { I18nService } from '@/core/i18n/i18n.service';
import { registerEmpresaTranslations } from '../translations/empresa-translations';
import { registerWorkflowTranslations } from '@shared/workflow/translations/workflow-translations';

@Component({
  selector: 'empresa-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppLayout],
  template: `<app-layout [menu]="menu()" [showWorkflowTracker]="true" />`,
})
export class EmpresaLayout implements OnInit {
  private readonly flow = inject(WorkflowFlowService);
  private readonly i18n = inject(I18nService);
  protected readonly menu = signal<MenuItem[]>(menuEmpresa);

  constructor() {
    registerEmpresaTranslations(this.i18n);
    registerWorkflowTranslations(this.i18n);
  }

  ngOnInit(): void {
    this.flow.setActor('empresa');
  }
}
