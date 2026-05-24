import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
  selector: 'institutional-validation-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe, TranslateContentPipe],
  templateUrl: './institutional-validation.html',
  styleUrl: './institutional-validation.scss',
})
export class InstitutionalValidationPage implements OnInit {
  private readonly flow = inject(WorkflowFlowMockService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly formErrors = inject(FormErroresMsg);
  private readonly i18n = inject(I18nService);

  protected readonly stage = WorkflowStage.InstitutionalValidation;
  protected loading = signal(true);
  protected checks = signal<ValidationCheck[]>([]);

  ngOnInit(): void {
    this.flow.ensureAccess(this.stage);
    this.loadChecks();
  }

  private async loadChecks(): Promise<void> {
    this.loading.set(true);
    try {
      const response=await this.workflow.getInstitutionalValidations();
      this.checks.set(response);
    } catch (err) {
      this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.institutionalValidation.loadError') });
    } finally {
      this.loading.set(false);
    }
  }

  allPassed(): boolean {
    return this.checks()  .every((c) => c.passed);
  }

  confirm(continueProcess: boolean): void {
    this.confirmation.confirm({
      message: continueProcess
        ? this.i18n.t('workflow.institutionalValidation.confirmContinue')
        : this.i18n.t('workflow.institutionalValidation.confirmIncident'),
      header: this.i18n.t('workflow.institutionalValidation.confirmHeader'),
      accept: async () => {
        this.loading.set(true);
        try {
          await this.workflow.confirmStage(this.stage);
          this.messages.add({ severity: continueProcess ? 'success' : 'warn', summary: this.i18n.t('workflow.institutionalValidation.success') });
          if (!continueProcess) {
            this.formErrors.showCustomError(this.i18n.t('workflow.institutionalValidation.flowInterrupted'));
            this.flow.resetFlow();
            this.flow.startFlow();
          }
        } catch (err) {
          this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.institutionalValidation.error') });
        } finally {
          this.loading.set(false);
        }
      },
    });
  }
}
