import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { PreprocessingTask, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowMockService } from '@sharedWorkflow/mocks/workflow-flow.mock.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';
import { I18nService } from '@/core/i18n/i18n.service';

@Component({
  selector: 'preprocessing-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe, TranslateContentPipe],
  templateUrl: './preprocessing.html',
  styleUrl: './preprocessing.scss',
})
export class PreprocessingPage implements OnInit {
  private readonly flow = inject(WorkflowFlowMockService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  protected readonly stage = WorkflowStage.Preprocessing;
  protected loading = signal(true);
  protected tasks=signal<PreprocessingTask[] >([]);

  ngOnInit(): void {
    this.flow.ensureAccess(this.stage);
    this.loadTasks();
  }

  private async loadTasks(): Promise<void> {
    this.loading.set(true);
    try {
      console.log('Cargando tareas de preprocesamiento...');
      const response= await this.workflow.getPreprocessingTasks();
      this.tasks.set(response);
    } catch (err) {
      this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.preprocessing.loadError') });
    } finally {
      console.log('Tareas de preprocesamiento cargadas:', this.tasks);
      this.loading.set(false);
    }
  }

  confirmStage(): void {
    this.confirmation.confirm({
      message: this.i18n.t('workflow.preprocessing.confirmMessage'),
      header: this.i18n.t('workflow.preprocessing.confirmHeader'),
      accept: async () => {
        this.loading.set(true);
        try {
          await this.workflow.confirmStage(this.stage);
          this.messages.add({ severity: 'success', summary: this.i18n.t('workflow.preprocessing.success') });
        } catch (err) {
          this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.preprocessing.error') });
        } finally {
          this.loading.set(false);
        }
      },
    });
  }
}
