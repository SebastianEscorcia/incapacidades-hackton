import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { IntakeFileResponse, IntakeValidationStatus, WorkflowStage } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { WorkflowFlowService } from '@sharedWorkflow/services/workflow-flow.service';
import { AiIncapacidadService } from '@sharedWorkflow/services/ai-incapacidad.service';
import { FormIntakeUpload } from './form-intake-upload';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { EMPRESA_COMPANIES, EmpresaCompany } from '../../const/empresa-companies.const';

@Component({
  selector: 'intake-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PrimeNGModules, TranslatePipe],
  templateUrl: './intake.html',
  styleUrl: './intake.scss',
})
export class IntakePage implements OnInit {
  private readonly ai = inject(AiIncapacidadService);
  private readonly flow = inject(WorkflowFlowService);
  private readonly workflow = inject(WorkflowService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly stage = WorkflowStage.Intake;
  protected readonly form = new FormIntakeUpload();
  protected readonly activeCase = this.flow.activeCase;
  protected selectedCompany: EmpresaCompany | null = null;
  protected loading = signal(true);
  protected submitted = false;
  protected files: IntakeFileResponse[] = [];

  protected get companyDisplayName(): string {
    return this.selectedCompany?.name ?? this.activeCase().company ?? '';
  }

  protected get companyDisplayMeta(): string {
    const id = this.selectedCompany?.id ?? this.activeCase().companyId ?? '';
    const ruc = this.selectedCompany?.ruc ?? '';
    return [id, ruc].filter(Boolean).join(' · ');
  }

  protected get hasCompany(): boolean {
    return Boolean(this.selectedCompany ?? this.activeCase().companyId);
  }

  anexarManualmente(): void {
    const activeCase = this.flow.activeCase();
    if (!activeCase.companyId) return;

    this.flow.activeCase.update((c) => ({
      ...c,
      status: WorkflowStage.EpsResponse,
      updatedAt: new Date().toISOString(),
    }));
    void this.router.navigateByUrl('/eps/eps-response');
  }

  ngOnInit(): void {
    this.flow.ensureAccess(this.stage);
    this.syncCompanyFromActiveCase();
    void this.loadValidations();
  }

  private syncCompanyFromActiveCase(): void {
    const activeCase = this.activeCase();
    if (!activeCase.companyId) {
      this.selectedCompany = null;
      return;
    }

    const company =
      EMPRESA_COMPANIES.find((item) => item.id === activeCase.companyId) ??
      ({
        id: activeCase.companyId,
        name: activeCase.company,
        sector: '',
        ruc: '',
      } satisfies EmpresaCompany);

    this.applyCompany(company);
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files ? Array.from(input.files) : [];
    input.value = '';

    const merged = [...this.form.files];
    for (const file of picked) {
      const error = this.ai.validateFile(file);
      if (error) {
        this.messages.add({ severity: 'warn', summary: `${file.name}: ${error}` });
        continue;
      }
      if (!merged.some((existing) => existing.name === file.name && existing.size === file.size)) {
        merged.push(file);
      }
    }
    this.form.setFiles(merged);
  }

  removeFile(index: number): void {
    const next = this.form.files.filter((_, i) => i !== index);
    this.form.setFiles(next);
  }

  submit(): void {
    if (this.loading()) return;

    this.submitted = true;
    if (!this.hasCompany) {
      this.form.companyId.markAsTouched();
    }
    if (this.form.invalid || !this.form.hasFiles() || !this.hasCompany) {
      this.form.markAllAsTouched();
      return;
    }

    const model = this.form.getModel();
    void this.executeUpload(model);
  }

  severity(status: IntakeValidationStatus): 'success' | 'danger' | 'warn' | 'info' {
    if (status === IntakeValidationStatus.Valid) return 'success';
    if (status === IntakeValidationStatus.Invalid) return 'danger';
    if (status === IntakeValidationStatus.Warning) return 'warn';
    return 'info';
  }

  private applyCompany(company: EmpresaCompany): void {
    this.selectedCompany = company;
    this.form.companyId.setValue(company.id);
    this.form.companyId.markAsDirty();
    this.flow.activeCase.update((current) => ({
      ...current,
      company: company.name,
      companyId: company.id,
      updatedAt: new Date().toISOString(),
    }));
  }

  private async loadValidations(): Promise<void> {
    this.loading.set(true);
    try {
      if (!this.flow.activeCase().primaryIncapacidadId) {
        this.files = [];
        return;
      }
      this.files = await this.workflow.getIntakeValidations();
    } catch (err) {
      const summary = this.workflow.isAiApiError(err) ? err.message : 'Error cargando validaciones';
      this.messages.add({ severity: 'error', summary });
    } finally {
      this.loading.set(false);
    }
  }

  private async executeUpload(model: ReturnType<FormIntakeUpload['getModel']>): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const uploaded = await this.workflow.uploadIntake(model, this.form.files);
      this.files = uploaded;
      this.messages.add({ severity: 'success', summary: 'Carga registrada' });
      this.flow.navigateNext(this.stage);
    } catch (err) {
      const summary = this.workflow.isAiApiError(err) ? err.message : 'Error al subir archivos';
      this.messages.add({ severity: 'error', summary });
    } finally {
      this.loading.set(false);
    }
  }
}
