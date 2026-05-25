import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { EpsResponsePayload, EpsResponseStatus, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowService } from '@sharedWorkflow/services/workflow-flow.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';

@Component({
  selector: 'eps-response-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe],
  templateUrl: './eps-response.html',
  styleUrl: './eps-response.scss',
})
export class EpsResponsePage implements OnInit {
  private readonly flow = inject(WorkflowFlowService);
  protected readonly actor = this.flow.actor;
  protected readonly activeCase = this.flow.activeCase;
  private readonly workflow = inject(WorkflowService);
  private readonly messages = inject(MessageService);

  protected readonly stage = WorkflowStage.EpsResponse;
  protected readonly loading = signal(false);
  protected readonly lastResponse = signal<EpsResponsePayload | null>(null);

  protected readonly outcomes = [
    { status: EpsResponseStatus.Approved, label: 'eps.response.approved', severity: 'success' as const, detail: 'eps.response.detailApproved' },
    { status: EpsResponseStatus.Glosa, label: 'eps.response.glosa', severity: 'warn' as const, detail: 'eps.response.detailGlosa' },
    { status: EpsResponseStatus.Rejected, label: 'eps.response.rejected', severity: 'danger' as const, detail: 'eps.response.detailRejected' },
    { status: EpsResponseStatus.RequiresSupport, label: 'eps.response.requiresSupport', severity: 'info' as const, detail: 'eps.response.detailRequiresSupport' },
  ];

  ngOnInit(): void {
    void this.simularDesdeBackend();
  }

  async simularDesdeBackend(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const response = await this.workflow.submitEpsResponse({
        status: EpsResponseStatus.InProcess,
        responseCode: '',
        notes: '',
      });
      this.lastResponse.set(response);
      this.messages.add({
        severity: 'success',
        summary: `Respuesta EPS: ${response.status}`,
        detail: response.notes || 'Simulación completada por backend.',
      });
      this.flow.navigateNext(this.stage);
    } catch (err) {
      this.messages.add({ severity: 'error', summary: 'Error simulando respuesta EPS en backend.' });
    } finally {
      this.loading.set(false);
    }
  }

  protected goBack(): void {
    this.flow.navigateBack(this.stage);
  }

  protected goToStart(): void {
    this.flow.goToStart();
  }
}
