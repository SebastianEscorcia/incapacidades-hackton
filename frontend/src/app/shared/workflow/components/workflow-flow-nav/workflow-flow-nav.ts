import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { WorkflowStage } from '../../types/workflow.enums';
import { WorkflowFlowMockService } from '../../mocks/workflow-flow.mock.service';

@Component({
  selector: 'workflow-flow-nav',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule],
  template: `
    <div class="workflow-nav">
      <div class="text-sm">
        <p-tag severity="info" [value]="mockCase().id" />
        <span class="ml-2">{{ mockCase().company }}</span>
      </div>
      @if (showMockAdvance()) {
        <p-button
          label="Simular avance (mock)"
          icon="pi pi-arrow-right"
          iconPos="right"
          class="p-button-sm"
          (onClick)="goNext()"
        />
      }
    </div>
  `,
  styleUrl: '../../styles/workflow-page.scss',
})
export class WorkflowFlowNav {
  private readonly flow = inject(WorkflowFlowMockService);

  readonly stage = input.required<WorkflowStage>();

  protected mockCase = this.flow.activeCase;

  protected showMockAdvance(): boolean {
    return this.mockCase().status === this.stage();
  }

  goNext(): void {
    this.flow.navigateNext(this.stage());
  }
}
