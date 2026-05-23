import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { EpsResponseStatus, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowMockService } from '@sharedWorkflow/mocks/workflow-flow.mock.service';
import { FormEpsResponse } from './form-eps-response';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { I18nService } from '@/core/i18n/i18n.service';

@Component({
  selector: 'eps-response-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe],
  templateUrl: './eps-response.html',
  styleUrl: './eps-response.scss',
})
export class EpsResponsePage {
  private readonly flow = inject(WorkflowFlowMockService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  protected readonly stage = WorkflowStage.EpsResponse;
  protected readonly form = new FormEpsResponse();
  protected readonly glosaStatus = EpsResponseStatus.Glosa;

  protected readonly outcomes = [
    { status: EpsResponseStatus.Approved, label: 'eps.response.approved', severity: 'success' as const, detail: 'eps.response.detailApproved' },
    { status: EpsResponseStatus.Glosa, label: 'eps.response.glosa', severity: 'warn' as const, detail: 'eps.response.detailGlosa' },
    { status: EpsResponseStatus.Rejected, label: 'eps.response.rejected', severity: 'danger' as const, detail: 'eps.response.detailRejected' },
    { status: EpsResponseStatus.RequiresSupport, label: 'eps.response.requiresSupport', severity: 'info' as const, detail: 'eps.response.detailRequiresSupport' },
  ];

  protected readonly statusOptions = [
    { label: 'eps.response.approved', value: EpsResponseStatus.Approved },
    { label: 'eps.response.glosa', value: EpsResponseStatus.Glosa },
    { label: 'eps.response.rejected', value: EpsResponseStatus.Rejected },
    { label: 'eps.response.requiresSupport', value: EpsResponseStatus.RequiresSupport },
  ];

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const model = this.form.getModel();
    const statusLabel = this.i18n.t(`eps.response.${model.status}`);
    this.confirmation.confirm({
      message: this.i18n.t('eps.response.confirmMessage', { status: statusLabel }),
      header: this.i18n.t('eps.response.confirmHeader'),
      accept: () => {
        (async () => {
          try {
            await this.workflow.submitEpsResponse(model);
            this.messages.add({ severity: 'success', summary: this.i18n.t('eps.response.success') });
          } catch (err) {
            this.messages.add({ severity: 'error', summary: this.i18n.t('eps.response.error') });
          }
        })();
      },
    });
  }
}
