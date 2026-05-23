import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WorkflowStage } from '../../types/workflow.enums';
import {
  stepsForActor,
  WorkflowActor,
  workflowStepPath,
} from '../../workflow.constants';

@Component({
  selector: 'workflow-stepper',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './workflow-stepper.html',
  styleUrl: './workflow-stepper.scss',
})
export class WorkflowStepper {
  readonly activeStep = input.required<WorkflowStage>();
  readonly actor = input.required<WorkflowActor>();

  protected readonly visibleSteps = computed(() =>
    stepsForActor(this.actor()).map((step) => ({
      ...step,
      path: workflowStepPath(step, this.actor()),
    })),
  );
}
