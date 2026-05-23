import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { AiResultStatus, AiResultSummary, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowMockService } from '@sharedWorkflow/mocks/workflow-flow.mock.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';

@Component({
  selector: 'ai-result-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PrimeNGModules, WorkflowFlowNav, TranslatePipe, TranslateContentPipe],
  templateUrl: './ai-result.html',
  styleUrl: './ai-result.scss',
})
export class AiResultPage implements OnInit {
  private readonly flow = inject(WorkflowFlowMockService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);

  protected readonly stage = WorkflowStage.AiResult;
  protected readonly approved = AiResultStatus.Approved;
  protected readonly rejected = AiResultStatus.Rejected;
  protected readonly manual = AiResultStatus.ManualReview;
  protected loading = signal(true);
  protected result: AiResultSummary | null = null;

  ngOnInit(): void {
    this.flow.ensureAccess(this.stage);
    this.loadResult();
  }

  private async loadResult(): Promise<void> {
    this.loading.set(true);
    try {
      this.result = await this.workflow.getAiResult();
    } catch (err) {
    } finally {
      this.loading.set(false);
    }
  }

  protected retryFlow(): void {
    this.flow.resetFlow();
    this.flow.startFlow();
  }
}
