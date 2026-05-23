import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { WorkflowStage, WorkflowTimelineEvent } from '@sharedWorkflow/types';
import { WorkflowFlowMockService } from '@sharedWorkflow/mocks/workflow-flow.mock.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';

@Component({
  selector: 'timeline-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, TranslatePipe, TranslateContentPipe],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class TimelinePage implements OnInit {
  private readonly flow = inject(WorkflowFlowMockService);
  protected readonly actor = this.flow.actor;

  protected readonly stage = WorkflowStage.Timeline;
  protected readonly events = this.flow.historyEvents;

  ngOnInit(): void {
    this.flow.ensureAccess(this.stage);
  }
}
