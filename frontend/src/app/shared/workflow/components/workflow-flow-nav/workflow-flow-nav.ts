import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { WorkflowStage } from '../../types/workflow.enums';
import { WorkflowFlowService } from '../../services/workflow-flow.service';

@Component({
  selector: 'workflow-flow-nav',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    @if (activeCase().primaryIncapacidadId || activeCase().company) {
      <div class="workflow-nav">
        <div class="text-sm">
          @if (activeCase().primaryIncapacidadId) {
            <p-tag severity="info" [value]="activeCase().primaryIncapacidadId!" />
          }
          @if (activeCase().company) {
            <span class="ml-2">{{ activeCase().company }}</span>
          }
        </div>
      </div>
    }
  `,
  styleUrl: '../../styles/workflow-page.scss',
})
export class WorkflowFlowNav {
  private readonly flow = inject(WorkflowFlowService);

  readonly stage = input.required<WorkflowStage>();

  protected activeCase = this.flow.activeCase;
}
