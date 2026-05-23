import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { ValidationCheck, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowMockService } from '@sharedWorkflow/mocks/workflow-flow.mock.service';
import { FormErroresMsg } from '@/core/services/form-errors.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';
import { I18nService } from '@/core/i18n/i18n.service';

@Component({
  selector: 'business-validation-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe, TranslateContentPipe],
  templateUrl: './business-validation.html',
  styleUrl: './business-validation.scss',
})
export class BusinessValidationPage implements OnInit {
  private readonly flow = inject(WorkflowFlowMockService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly formErrors = inject(FormErroresMsg);
  private readonly i18n = inject(I18nService);

  protected readonly stage = WorkflowStage.BusinessValidation;
  protected loading = true;
  protected checks: ValidationCheck[] = [];

  ngOnInit(): void {
    this.flow.ensureAccess(this.stage);
    this.loadChecks();
  }

  private async loadChecks(): Promise<void> {
    this.loading = true;
    try {
      this.checks = await this.workflow.getBusinessValidations();
    } catch (err) {
      this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.businessValidation.loadError') });
    } finally {
      this.loading = false;
    }
  }

  allPassed(): boolean {
    return this.checks.every((c) => c.passed);
  }

  confirmStage(): void {
    this.confirmation.confirm({
      message: this.allPassed()
        ? this.i18n.t('workflow.businessValidation.confirmContinue')
        : this.i18n.t('workflow.businessValidation.confirmIncident'),
      header: this.i18n.t('workflow.businessValidation.confirmHeader'),
      accept: async () => {
        this.loading = true;
        try {
          await this.workflow.confirmStage(this.stage);
          this.messages.add({ severity: this.allPassed() ? 'success' : 'warn', summary: this.i18n.t('workflow.businessValidation.success') });
          if (!this.allPassed()) {
            this.formErrors.showCustomError(this.i18n.t('workflow.businessValidation.flowInterrupted'));
            this.flow.resetFlow();
            this.flow.startFlow();
          }
        } catch (err) {
          this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.businessValidation.error') });
        } finally {
          this.loading = false;
        }
      },
    });
  }
}
