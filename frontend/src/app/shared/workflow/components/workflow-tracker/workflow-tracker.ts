import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { WorkflowStage } from '../../types/workflow.enums';
import { WorkflowFlowService } from '../../services/workflow-flow.service';
import { FlowStepConfig, WORKFLOW_FLOW, workflowStepPath } from '../../workflow.constants';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'workflow-tracker',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './workflow-tracker.html',
  styleUrl: './workflow-tracker.scss',
})
export class WorkflowTracker {
  private readonly flow = inject(WorkflowFlowService);
  private readonly router = inject(Router);

  protected readonly activeCase = this.flow.activeCase;

  protected readonly steps = WORKFLOW_FLOW;

  protected readonly currentUrl = signal(this.router.url);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      }
    });
  }

  protected readonly currentIndex = computed(() => {
    const url = this.currentUrl();
    const index = WORKFLOW_FLOW.findIndex((step) => url.includes(step.segment));
    if (index >= 0) return index;

    const status = this.activeCase().status;
    const fallbackIndex = WORKFLOW_FLOW.findIndex((step) => step.stage === status);
    return fallbackIndex >= 0 ? fallbackIndex : 0;
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

  protected canClick(step: FlowStepConfig): boolean {
    return this.flow.canAccess(step.stage);
  }

  protected clickStep(step: FlowStepConfig): void {
    if (this.canClick(step)) {
      void this.router.navigateByUrl(workflowStepPath(step, this.flow.actor()));
    }
  }
}
