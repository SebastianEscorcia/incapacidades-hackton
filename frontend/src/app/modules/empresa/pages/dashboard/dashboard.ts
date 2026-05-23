import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { WorkflowFlowMockService } from '@shared/workflow/mocks/workflow-flow.mock.service';
import { DashboardSummary } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';

@Component({
  selector: 'workflow-dashboard-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, TranslatePipe, TranslateContentPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage implements OnInit {
  private readonly workflow = inject(WorkflowService);
  private readonly flow = inject(WorkflowFlowMockService);

  protected loading = true;
  protected data: DashboardSummary | null = null;

  ngOnInit(): void {
    this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.loading = true;
    try {
      this.data = await this.workflow.getDashboard();
    } catch (err) {
      /* handle error */
    } finally {
      this.loading = false;
    }
  }

  protected readonly companies = [
    { id: 'COMP-001', name: 'Acme Salud Ocupacional', sector: 'Servicios', ruc: '800123456-1' },
    { id: 'COMP-002', name: 'Logística del Norte', sector: 'Transporte', ruc: '900987654-2' },
    { id: 'COMP-003', name: 'Servicios Médicos Integrales', sector: 'Salud', ruc: '890456123-3' },
    { id: 'COMP-004', name: 'Construcciones y Equipos SAS', sector: 'Construcción', ruc: '901321789-4' }
  ];

  selectCompany(companyId: string, companyName: string): void {
    this.flow.resetFlow(companyId, companyName);
    this.flow.startFlow(companyId, companyName);
  }
}
