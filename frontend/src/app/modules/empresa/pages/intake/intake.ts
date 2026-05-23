import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { IntakeFileResponse, IntakeValidationStatus, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';
import { WorkflowFlowMockService } from '@sharedWorkflow/mocks/workflow-flow.mock.service';
import { FormIntakeUpload } from './form-intake-upload';
import { TranslatePipe } from '@/core/i18n/translate.pipe';

@Component({
  selector: 'intake-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe],
  templateUrl: './intake.html',
  styleUrl: './intake.scss',
})
export class IntakePage implements OnInit {
  private readonly flow = inject(WorkflowFlowMockService);
  private readonly workflow = inject(WorkflowService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly stage = WorkflowStage.Intake;

  protected readonly companies = [
    { label: 'Acme Salud Ocupacional (COMP-001)', value: 'COMP-001' },
    { label: 'Logística del Norte (COMP-002)', value: 'COMP-002' },
    { label: 'Servicios Médicos Integrales (COMP-003)', value: 'COMP-003' },
    { label: 'Construcciones y Equipos SAS (COMP-004)', value: 'COMP-004' }
  ];
  protected readonly form = new FormIntakeUpload();
  protected loading = signal(true);
  protected submitted = false;
  protected files: IntakeFileResponse[] = [];

  ngOnInit(): void {
    this.flow.ensureAccess(this.stage);
    this.loadValidations();

    const activeCase = this.flow.activeCase();
    if (activeCase.companyId) {
      this.form.companyId.setValue(activeCase.companyId);
    }

    this.form.companyId.valueChanges.subscribe((val) => {
      if (val) {
        const found = this.companies.find((c) => c.value === val);
        if (found) {
          this.flow.activeCase.update((current) => ({
            ...current,
            company: found.label,
            companyId: found.value,
          }));
        }
      }
    });
  }

  private async loadValidations(): Promise<void> {
    this.loading.set(true);
    try {
      const files = await this.workflow.getIntakeValidations();
      this.files = files;
    } catch (err) {
      this.messages.add({ severity: 'error', summary: 'Error cargando validaciones' });
    } finally {
      this.loading.set(false);
    }
  }

  onFilesSelected(event: { currentFiles: File[] }): void {
    this.form.setFiles(event.currentFiles);
  }

  onFileRemoved(event: unknown): void {
    const payload = event as { files?: File[]; currentFiles?: File[] };
    this.form.setFiles(payload.files ?? payload.currentFiles ?? []);
  }

  anexarManualmente(): void {
    const companyId = this.form.companyId.value;
    if (!companyId) return;
    const companyName = this.companies.find((c) => c.value === companyId)?.label || '';
    this.flow.activeCase.update((c) => ({
      ...c,
      status: WorkflowStage.ManualReview,
      company: companyName,
      updatedAt: new Date().toISOString(),
    }));
    void this.router.navigateByUrl('/eps/manual-review');
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid || !this.form.hasFiles()) {
      this.form.markAllAsTouched();
      return;
    }

    const model = this.form.getModel();
    this.confirmation.confirm({
      message: `Confirmar carga de ${model.fileCount} archivo(s)?`,
      header: 'Confirmar intake',
      icon: 'pi pi-upload',
      accept: () => {
        (async () => {
          this.loading.set(true);
          try {
            const files = await this.workflow.uploadIntake(model, this.form.files);
            this.files = files;
            this.messages.add({ severity: 'success', summary: 'Carga registrada' });
            this.flow.navigateNext(this.stage);
          } catch (err) {
            this.messages.add({ severity: 'error', summary: 'Error al subir archivos' });
          } finally {
            this.loading.set(false);
          }
        })();
      },
    });
  }

  severity(status: IntakeValidationStatus): 'success' | 'danger' | 'warn' | 'info' {
    if (status === IntakeValidationStatus.Valid) return 'success';
    if (status === IntakeValidationStatus.Invalid) return 'danger';
    if (status === IntakeValidationStatus.Warning) return 'warn';
    return 'info';
  }
}
