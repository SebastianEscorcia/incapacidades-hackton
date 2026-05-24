import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowMockService } from '@sharedWorkflow/mocks/workflow-flow.mock.service';
import { FormManualReview } from './form-manual-review';
import { FormErroresMsg } from '@/core/services/form-errors.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { I18nService } from '@/core/i18n/i18n.service';

@Component({
  selector: 'manual-review-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe],
  templateUrl: './manual-review.html',
  styleUrl: './manual-review.scss',
})
export class ManualReviewPage {
  private readonly flow = inject(WorkflowFlowMockService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly formErrors = inject(FormErroresMsg);
  private readonly i18n = inject(I18nService);

  protected readonly stage = WorkflowStage.ManualReview;
  protected readonly form = new FormManualReview();

  protected readonly checklist = [
    { control: 'validateAnomalies' as const, label: 'eps.manualReview.validateAnomalies' },
    { control: 'reviewFraud' as const, label: 'eps.manualReview.reviewFraud' },
    { control: 'reviewCoherence' as const, label: 'eps.manualReview.reviewCoherence' },
    { control: 'reviewQuality' as const, label: 'eps.manualReview.reviewQuality' },
  ];

  submit(): void {
    if (this.form.invalid) {
      this.formErrors.getErroresForm(this.form);
      return;
    }
    const model = this.form.getModel();
    this.confirmation.confirm({
      message: model.requiresCompanyAction
        ? this.i18n.t('eps.manualReview.confirmCompanyAction')
        : this.i18n.t('eps.manualReview.confirmNormal'),
      header: this.i18n.t('eps.manualReview.confirmHeader'),
      accept: () => {
        (async () => {
          try {
            await this.workflow.submitManualReview(model);
            this.messages.add({ severity: 'success', summary: this.i18n.t('eps.manualReview.success') });
            if (model.requiresCompanyAction) {
              this.form.setErrors({ flowInterrupted: true });
              this.formErrors.getErroresForm(this.form);
              this.flow.resetFlow();
              this.flow.startFlow();
            }
          } catch (err) {
            this.messages.add({ severity: 'error', summary: this.i18n.t('eps.manualReview.error') });
          }
        })();
      },
    });
  }
}
