import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { RadicacionChannel, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowService } from '@sharedWorkflow/services/workflow-flow.service';
import { FormRadicacion } from './form-radicacion';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { I18nService } from '@/core/i18n/i18n.service';

@Component({
  selector: 'radicacion-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe],
  templateUrl: './radicacion.html',
  styleUrl: './radicacion.scss',
})
export class RadicacionPage {
  private readonly flow = inject(WorkflowFlowService);
  protected readonly actor = this.flow.actor;
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  protected readonly stage = WorkflowStage.Radicacion;
  protected readonly form = new FormRadicacion();

  protected readonly channels = [
    { label: 'eps.radicacion.api', icon: 'pi pi-code' },
    { label: 'eps.radicacion.portal', icon: 'pi pi-globe' },
    { label: 'eps.radicacion.email', icon: 'pi pi-envelope' },
    { label: 'eps.radicacion.external', icon: 'pi pi-link' },
    { label: 'eps.radicacion.operator', icon: 'pi pi-user' },
  ];

  protected readonly channelOptions = [
    { label: 'eps.radicacion.api', value: RadicacionChannel.Api },
    { label: 'eps.radicacion.portal', value: RadicacionChannel.Portal },
    { label: 'eps.radicacion.email', value: RadicacionChannel.Email },
    { label: 'eps.radicacion.external', value: RadicacionChannel.External },
    { label: 'eps.radicacion.operator', value: RadicacionChannel.Operator },
  ];

  protected readonly entities = [
    { label: 'EPS', value: 'eps' as const },
    { label: 'ARL', value: 'arl' as const },
  ];

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const model = this.form.getModel();
    const channelName = this.i18n.t(`eps.radicacion.${model.channel}`);
    this.confirmation.confirm({
      message: this.i18n.t('eps.radicacion.confirmMessage', {
        channel: channelName,
        entity: model.targetEntity.toUpperCase(),
      }),
      header: this.i18n.t('eps.radicacion.confirmHeader'),
      accept: () => {
        (async () => {
          try {
            await this.workflow.submitRadicacion(model);
            this.messages.add({ severity: 'success', summary: this.i18n.t('eps.radicacion.success') });
          } catch (err) {
            this.messages.add({ severity: 'error', summary: this.i18n.t('eps.radicacion.error') });
          }
        })();
      },
    });
  }

  protected goBack(): void {
    this.flow.navigateBack(this.stage);
  }
}
