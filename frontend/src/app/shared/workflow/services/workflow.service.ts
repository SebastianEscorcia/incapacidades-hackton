import { Injectable } from '@angular/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { EpsResponseAdapter } from '../adapters/eps-response.adapter';
import { IntakeAdapter } from '../adapters/intake.adapter';
import { ProcessingAdapter } from '../adapters/processing.adapter';
import { WorkflowAdapter } from '../adapters/workflow.adapter';
import {
  AiResultStatus,
  AiResultSummary,
  AiValidationMetric,
  DashboardSummary,
  DocumentFileType,
  EpsResponsePayload,
  EpsResponseStatus,
  ExpedientePayload,
  IntakeFileResponse,
  IntakeUploadPayload,
  IntakeValidationStatus,
  ManualReviewPayload,
  PreprocessingTask,
  RadicacionPayload,
  RequirementPayload,
  ValidationCheck,
  WorkflowStage,
  WorkflowTimelineEvent,
} from '../types';

// Removed artificial mock delays to avoid UI freeze; use signals for loading state.

// Ejemplo de cómo conectar la API real y manejar errores (comentar / copiar cuando se implemente):
/*
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment.development';

@Injectable({ providedIn: 'root' })
export class RealWorkflowService {
  private _http = inject(HttpClient);
  private _api = environment.apiUrl;
  private _prefix = 'workflow';

  // Ejemplo: subir intake usando la API real con manejo de errores
  async uploadIntakeApi(model: any, files: File[]) {
    // Preparar payload / formData según API
    const response = await firstValueFrom(
      this._http.post<any>(`${this._api}/${this._prefix}/intake`, model).pipe(
        catchError(err => throwError(() => err))
      )
    );
    return response.data;
  }
}
*/

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  async uploadIntake(model: IntakeUploadPayload, files: File[]): Promise<IntakeFileResponse[]> {
    void IntakeAdapter.toJsonPayload(model);
    void files;
    return firstValueFrom(of(this.mockIntakeFiles()));
  }

  async getIntakeValidations(): Promise<IntakeFileResponse[]> {
    return firstValueFrom(of(this.mockIntakeFiles()));
  }

  async getPreprocessingTasks(): Promise<PreprocessingTask[]> {
    return firstValueFrom(
      of([
        { id: '1', label: 'OCR', completed: true, detail: 'Texto extraído' },
        { id: '2', label: 'Extracción de texto', completed: true },
        { id: '3', label: 'Clasificación documental', completed: true },
        { id: '4', label: 'Detección de páginas', completed: false, detail: 'En progreso' },
        { id: '5', label: 'Normalización', completed: false },
        { id: '6', label: 'Indexación', completed: false },
      ]),
    );
  }

  async getAiValidationMetrics(): Promise<AiValidationMetric[]> {
    return firstValueFrom(
      of([
        { id: '1', label: 'Calidad imagen', score: 92, status: IntakeValidationStatus.Valid },
        { id: '2', label: 'Legibilidad', score: 88, status: IntakeValidationStatus.Valid },
        { id: '3', label: 'Consistencia', score: 74, status: IntakeValidationStatus.Warning, detail: 'Revisar fechas' },
        { id: '4', label: 'Posible alteración', score: 95, status: IntakeValidationStatus.Valid },
        { id: '5', label: 'Confianza OCR', score: 91, status: IntakeValidationStatus.Valid },
        { id: '6', label: 'Anomalías', score: 68, status: IntakeValidationStatus.Warning },
        { id: '7', label: 'Completitud documental', score: 85, status: IntakeValidationStatus.Valid },
      ]),
    );
  }

  async getAiResult(): Promise<AiResultSummary> {
    return firstValueFrom(of(
      ProcessingAdapter.toAiResult({
        status: AiResultStatus.ManualReview,
        confidence: 78,
        findings: [{ message: 'Inconsistencia en fechas' }, { message: 'OCR bajo página 3' }],
      }),
    ));
  }

  async submitManualReview(model: ManualReviewPayload): Promise<{ success: boolean }> {
    void ProcessingAdapter.manualReviewToPayload(model);
    return firstValueFrom(of({ success: true }));
  }

  async submitRequirement(model: RequirementPayload): Promise<{ success: boolean }> {
    void WorkflowAdapter.requirementToPayload(model);
    return firstValueFrom(of({ success: true }));
  }

  async getBusinessValidations(): Promise<ValidationCheck[]> {
    return firstValueFrom(of(
      WorkflowAdapter.toValidationChecks({
        checks: [
          { id: '1', label: 'Fechas coherentes', passed: true },
          { id: '2', label: 'Días incapacidad', passed: true },
          { id: '3', label: 'Duplicidad', passed: false, detail: 'Documento ya radicado' },
          { id: '4', label: 'Documento completo', passed: true },
          { id: '5', label: 'Formato EPS', passed: true },
          { id: '6', label: 'Reglas parametrizadas', passed: true },
          { id: '7', label: 'Validaciones internas', passed: true },
        ],
      }),
    ));
  }

  async getInstitutionalValidations(): Promise<ValidationCheck[]> {
    return firstValueFrom(of(
      WorkflowAdapter.toValidationChecks({
        checks: [
          { id: '1', label: 'Médico en RETHUS', passed: true },
          { id: '2', label: 'IPS/prestador en REPS', passed: true },
          { id: '3', label: 'Afiliación EPS', passed: false, detail: 'Afiliación inactiva' },
          { id: '4', label: 'Validación gubernamental futura', passed: true },
          { id: '5', label: 'Coherencia datos usuario', passed: true },
        ],
      }),
    ));
  }

  async submitExpediente(model: ExpedientePayload): Promise<{ success: boolean }> {
    void WorkflowAdapter.expedienteToPayload(model);
    return firstValueFrom(of({ success: true }));
  }

  async submitRadicacion(model: RadicacionPayload): Promise<{ success: boolean }> {
    void WorkflowAdapter.radicacionToPayload(model);
    return firstValueFrom(of({ success: true }));
  }

  async submitEpsResponse(model: EpsResponsePayload): Promise<EpsResponsePayload> {
    return firstValueFrom(of(EpsResponseAdapter.fromApi(EpsResponseAdapter.toPayload(model))));
  }

  async getTimeline(): Promise<WorkflowTimelineEvent[]> {
    return firstValueFrom(of(
      WorkflowAdapter.toTimeline({
        events: [
          { id: '1', stage: WorkflowStage.Intake, title: 'Carga masiva', description: '12 documentos', timestamp: '2026-05-20T10:00:00', actor: 'Empresa' },
          { id: '2', stage: WorkflowStage.Preprocessing, title: 'OCR', description: 'Indexado', timestamp: '2026-05-20T10:15:00', actor: 'Sistema' },
        ],
      }),
    ));
  }

  async getDashboard(): Promise<DashboardSummary> {
    return firstValueFrom(of(
      WorkflowAdapter.toDashboard({
        metrics: [
          { label: 'En proceso', value: 24, trend: '+3', icon: 'pi pi-sync' },
          { label: 'Aprobados', value: 156, trend: '+12', icon: 'pi pi-check-circle' },
          { label: 'Glosas', value: 8, icon: 'pi pi-exclamation-circle' },
          { label: 'Rechazados', value: 5, icon: 'pi pi-times-circle' },
        ],
        recentRequirements: [{ id: 'r1', title: 'Recargar incapacidad', status: 'Pendiente' }],
        recentGlosas: [{ id: 'g1', code: 'G-104', detail: 'Fecha inconsistente' }],
        finalResults: [{ id: 'f1', status: EpsResponseStatus.Approved, date: '2026-05-18' }],
      }),
    ));
  }

  async confirmStage(stage: WorkflowStage): Promise<{ success: boolean }> {
    void stage;
    return firstValueFrom(of({ success: true }));
  }

  private mockIntakeFiles(): IntakeFileResponse[] {
    return IntakeAdapter.toDomainList({
      files: [
        { id: '1', name: 'incapacidad-001.pdf', type: DocumentFileType.Pdf, sizeBytes: 204800, validationStatus: IntakeValidationStatus.Valid },
        { id: '2', name: 'soporte.jpg', type: DocumentFileType.Image, sizeBytes: 512000, validationStatus: IntakeValidationStatus.Valid },
        { id: '3', name: 'duplicado.pdf', type: DocumentFileType.Pdf, sizeBytes: 102400, validationStatus: IntakeValidationStatus.Invalid, validationMessage: 'Duplicado' },
      ],
    });
  }
}
