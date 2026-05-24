import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { RequirementAction, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowService } from '@sharedWorkflow/services/workflow-flow.service';
import { FormRequirement } from './form-requirement';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { I18nService } from '@/core/i18n/i18n.service';

@Component({
  selector: 'requirement-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe],
  templateUrl: './requirement.html',
  styleUrl: './requirement.scss',
})
export class RequirementPage {
  private readonly flow = inject(WorkflowFlowService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  protected readonly stage = WorkflowStage.Requirement;
  protected readonly form = new FormRequirement();

  get fields() {
    return this.form.fields;
  }

  addField(): void {
    this.form.addField();
  }

  removeField(index: number): void {
    this.form.removeField(index);
  }

  protected readonly actions = [
    { label: 'empresa.requirement.reloadDoc', value: RequirementAction.ReloadDoc },
    { label: 'empresa.requirement.attachSupport', value: RequirementAction.AttachSupport },
    { label: 'empresa.requirement.fixData', value: RequirementAction.FixData },
    { label: 'empresa.requirement.newEvidence', value: RequirementAction.NewEvidence },
  ];

  onFilesSelected(event: { currentFiles: File[] }): void {
    this.form.setFiles(event.currentFiles);
  }

  skipStep(): void {
    this.flow.navigateNext(this.stage);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmation.confirm({
      message: this.i18n.t('empresa.requirement.confirmMessage'),
      header: this.i18n.t('empresa.requirement.confirmHeader'),
      accept: () => {
        (async () => {
          try {
            await this.workflow.submitRequirement(this.form.getModel());
            this.messages.add({ severity: 'success', summary: this.i18n.t('empresa.requirement.success') });
            this.flow.navigateNext(this.stage);
          } catch (err) {
            this.messages.add({ severity: 'error', summary: this.i18n.t('empresa.requirement.error') });
          }
        })();
      },
    });
  }

  protected goBack(): void {
    this.flow.navigateBack(this.stage);
  }
}
