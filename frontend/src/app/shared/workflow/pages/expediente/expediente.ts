import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowService } from '@sharedWorkflow/services/workflow-flow.service';
import { FormExpediente } from './form-expediente';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { I18nService } from '@/core/i18n/i18n.service';

@Component({
  selector: 'expediente-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe],
  templateUrl: './expediente.html',
  styleUrl: './expediente.scss',
})
export class ExpedientePage {
  private readonly flow = inject(WorkflowFlowService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  protected readonly stage = WorkflowStage.Expediente;
  protected readonly form = new FormExpediente();

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const model = this.form.getModel();
    this.confirmation.confirm({
      message: this.i18n.t('workflow.expediente.confirmMessage', { count: model.documentIds.length }),
      header: this.i18n.t('workflow.expediente.confirmHeader'),
      accept: async () => {
        try {
          await this.workflow.submitExpediente(model);
          this.messages.add({ severity: 'success', summary: this.i18n.t('workflow.expediente.success') });
        } catch (err) {
          this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.expediente.error') });
        }
      },
    });
  }

  protected goBack(): void {
    this.flow.navigateBack(this.stage);
  }
}
