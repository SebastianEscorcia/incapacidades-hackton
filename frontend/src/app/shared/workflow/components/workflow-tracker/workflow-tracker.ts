import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { WorkflowStage } from '../../types/workflow.enums';
import { WorkflowFlowMockService } from '../../mocks/workflow-flow.mock.service';
import { WORKFLOW_FLOW } from '../../workflow.constants';
import { TranslatePipe } from '@/core/i18n/translate.pipe';

@Component({
  selector: 'workflow-tracker',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './workflow-tracker.html',
  styleUrl: './workflow-tracker.scss',
})
export class WorkflowTracker {
  private readonly flow = inject(WorkflowFlowMockService);

  protected readonly activeCase = this.flow.activeCase;

  protected readonly steps = WORKFLOW_FLOW;

  protected readonly currentIndex = computed(() => {
    const status = this.activeCase().status;
    const index = WORKFLOW_FLOW.findIndex((step) => step.stage === status);
    return index >= 0 ? index : 0;
  });

  protected stepState(index: number): 'done' | 'active' | 'pending' {
    const current = this.currentIndex();
    if (index < current) return 'done';
    if (index === current) return 'active';
    return 'pending';
  }

  protected markerIcon(index: number, defaultIcon: string): string {
    return this.stepState(index) === 'done' ? 'pi pi-check' : defaultIcon;
  }
}
