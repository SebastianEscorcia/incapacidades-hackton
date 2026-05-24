import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { AiValidationMetric, IntakeValidationStatus, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowMockService } from '@sharedWorkflow/mocks/workflow-flow.mock.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';
import { I18nService } from '@/core/i18n/i18n.service';

@Component({
  selector: 'ai-validation-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe, TranslateContentPipe],
  templateUrl: './ai-validation.html',
  styleUrl: './ai-validation.scss',
})
export class AiValidationPage implements OnInit {
  private readonly flow = inject(WorkflowFlowMockService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  protected readonly stage = WorkflowStage.AiValidation;
  protected loading = signal(true);
  protected metrics: AiValidationMetric[] = [];

  ngOnInit(): void {
    this.flow.ensureAccess(this.stage);
    this.loadMetrics();
  }

  private async loadMetrics(): Promise<void> {
    this.loading.set(true);
    try {
      this.metrics = await this.workflow.getAiValidationMetrics();
    } catch (err) {
      this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.aiValidation.loadError') });
    } finally {
      this.loading.set(false);
    }
  }

  confirmStage(): void {
    this.confirmation.confirm({
      message: this.i18n.t('workflow.aiValidation.confirmMessage'),
      header: this.i18n.t('workflow.aiValidation.confirmHeader'),
      accept: async () => {
        this.loading.set(true);
        try {
          await this.workflow.confirmStage(this.stage);
          this.messages.add({ severity: 'info', summary: this.i18n.t('workflow.aiValidation.success') });
        } catch (err) {
          this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.aiValidation.error') });
        } finally {
          this.loading.set(false);
        }
      },
    });
  }

  severity(status: IntakeValidationStatus): 'success' | 'danger' | 'warn' | 'info' {
    if (status === IntakeValidationStatus.Valid) return 'success';
    if (status === IntakeValidationStatus.Invalid) return 'danger';
    if (status === IntakeValidationStatus.Warning) return 'warn';
    return 'info';
  }
}
