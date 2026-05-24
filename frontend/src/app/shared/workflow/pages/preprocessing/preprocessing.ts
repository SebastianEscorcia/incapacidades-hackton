import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { PreprocessingTask, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { AiRealtimeService } from '@sharedWorkflow/services/ai-realtime.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowService } from '@sharedWorkflow/services/workflow-flow.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';
import { I18nService } from '@/core/i18n/i18n.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'preprocessing-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe, TranslateContentPipe],
  templateUrl: './preprocessing.html',
  styleUrl: './preprocessing.scss',
})
export class PreprocessingPage implements OnInit, OnDestroy {
  private readonly flow = inject(WorkflowFlowService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly realtime = inject(AiRealtimeService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);
  private scrapingSubscription?: Subscription;

  protected readonly stage = WorkflowStage.Preprocessing;
  protected loading = signal(true);
  protected processingFailed = signal(false);
  protected motivo = signal<string | undefined>(undefined);
  protected tasks = signal<PreprocessingTask[]>([]);

  ngOnInit(): void {
    this.flow.ensureAccess(this.stage);
    this.workflow.connectRealtime();
    void this.loadTasks();

    this.scrapingSubscription = this.realtime.scrapingCompletado$.subscribe((event) => {
      const activeId = this.flow.activeCase().primaryIncapacidadId;
      const eventId = event.incapacidadId ?? event.id;
      if (!activeId || eventId !== activeId) return;
      void this.loadTasks();
    });
  }

  ngOnDestroy(): void {
    this.scrapingSubscription?.unsubscribe();
  }

  private async loadTasks(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.workflow.getPreprocessingTasks();
      this.tasks.set(response);
      const failedTask = response.find((task) => task.state === 'failed' && task.id === '1');
      this.processingFailed.set(Boolean(failedTask));
      this.motivo.set(failedTask?.detail);
    } catch (err) {
      this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.preprocessing.loadError') });
    } finally {
      this.loading.set(false);
    }
  }

  taskIcon(task: PreprocessingTask): string {
    if (task.state === 'completed') return 'pi pi-check-circle workflow-check-icon--ok';
    if (task.state === 'failed') return 'pi pi-times-circle workflow-check-icon--fail';
    return 'pi pi-spin pi-spinner workflow-spinner-icon';
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

  protected goBack(): void {
    this.flow.navigateBack(this.stage);
  }
}