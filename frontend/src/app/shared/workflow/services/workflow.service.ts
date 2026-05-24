import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AiIncapacidadAdapter } from '../adapters/ai-incapacidad.adapter';
import { EpsResponseAdapter } from '../adapters/eps-response.adapter';
import { IntakeAdapter } from '../adapters/intake.adapter';
import { ProcessingAdapter } from '../adapters/processing.adapter';
import { WorkflowAdapter } from '../adapters/workflow.adapter';
import { WorkflowFlowMockService } from '../mocks/workflow-flow.mock.service';
import { AiIncapacidadService, AiApiError } from './ai-incapacidad.service';
import {
  AiResultStatus,
  AiResultSummary,
  AiValidationMetric,
  DashboardSummary,
  DocumentFileType,
  EpsResponsePayload,
  EpsResponseStatus,
  ExpedientePayload,
  FraudeAlerta,
  IncapacidadListFilters,
  IncapacidadListItem,
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

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly ai = inject(AiIncapacidadService);
  private readonly flow = inject(WorkflowFlowMockService);

  async uploadIntake(model: IntakeUploadPayload, files: File[]): Promise<IntakeFileResponse[]> {
    void IntakeAdapter.toJsonPayload(model);
    if (!files.length) return [];

    const uploaded: IntakeFileResponse[] = [];
    const incapacidadIds: string[] = [];

    for (const file of files) {
      const result = await this.ai.uploadDocumento(file);
      uploaded.push(AiIncapacidadAdapter.uploadToIntakeFile(result, file));
      incapacidadIds.push(result.id);
    }

    this.flow.activeCase.update((current) => ({
      ...current,
      incapacidadIds,
      primaryIncapacidadId: incapacidadIds[0],
      updatedAt: new Date().toISOString(),
    }));

    return uploaded;
  }

  async getIntakeValidations(): Promise<IntakeFileResponse[]> {
    const primaryId = this.flow.activeCase().primaryIncapacidadId;
    if (!primaryId) {
      return firstValueFrom(of(this.mockIntakeFiles()));
    }

    try {
      const detail = await this.ai.getIncapacidad(primaryId);
      return [
        {
          id: detail.id,
          name: `incapacidad-${detail.id.slice(0, 8)}`,
          type: DocumentFileType.Pdf,
          sizeBytes: 0,
          validationStatus: this.mapAiStatusToValidation(detail.estado),
          validationMessage: detail.findings[0],
        },
      ];
    } catch {
      return firstValueFrom(of(this.mockIntakeFiles()));
    }
  }

  async getPreprocessingTasks(): Promise<PreprocessingTask[]> {
    const primaryId = this.flow.activeCase().primaryIncapacidadId;
    if (primaryId) {
      try {
        const detail = await this.ai.getIncapacidad(primaryId);
        const processed = detail.estado !== AiResultStatus.Pending;
        return [
          { id: '1', label: 'OCR', completed: processed, detail: processed ? 'Texto extraído' : 'En procesamiento' },
          { id: '2', label: 'Extracción IA', completed: processed, detail: detail.datosExtraidos ? 'Datos clínicos detectados' : undefined },
          { id: '3', label: 'Validación documental', completed: processed },
          { id: '4', label: 'Motor antifraude', completed: processed, detail: detail.findings[0] },
          { id: '5', label: 'Normalización', completed: processed },
          { id: '6', label: 'Indexación', completed: processed },
        ];
      } catch {
        // fallback mock
      }
    }

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
    const primaryId = this.flow.activeCase().primaryIncapacidadId;
    if (primaryId) {
      try {
        const detail = await this.ai.getIncapacidad(primaryId);
        return AiIncapacidadAdapter.toMetrics(detail);
      } catch {
        // fallback mock
      }
    }

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
    const primaryId = this.flow.activeCase().primaryIncapacidadId;
    if (primaryId) {
      try {
        const detail = await this.ai.getIncapacidad(primaryId);
        return AiIncapacidadAdapter.toAiResultSummary(detail);
      } catch {
        // fallback mock
      }
    }

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
    const primaryId = this.flow.activeCase().primaryIncapacidadId;
    if (primaryId) {
      try {
        const detail = await this.ai.getIncapacidad(primaryId);
        const registro = detail.datosExtraidos?.medicoRegistroDocumento;
        const rethus = registro ? await this.ai.verificarRethus(registro) : null;

        return [
          {
            id: '1',
            label: 'Médico en RETHUS',
            passed: rethus ? rethus.existe && rethus.estado === 'ACTIVO' : !detail.requiereVerificacionRethus,
            detail: rethus ? `${rethus.nombreMedico} (${rethus.estado})` : undefined,
          },
          { id: '2', label: 'IPS/prestador en REPS', passed: Boolean(detail.datosExtraidos?.ipsNombre) },
          { id: '3', label: 'Afiliación EPS', passed: Boolean(detail.datosExtraidos?.eps), detail: detail.datosExtraidos?.eps },
          { id: '4', label: 'Validación gubernamental futura', passed: true },
          { id: '5', label: 'Coherencia datos usuario', passed: detail.anomaliasDetectadas.length === 0, detail: detail.anomaliasDetectadas[0] },
        ];
      } catch {
        // fallback mock
      }
    }

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
    try {
      const items = await this.ai.listIncapacidades();
      if (items.length) {
        return this.buildDashboardFromIncapacidades(items);
      }
    } catch {
      // fallback mock
    }

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

  async listIncapacidades(filters: IncapacidadListFilters = {}): Promise<IncapacidadListItem[]> {
    return this.ai.listIncapacidades(filters);
  }

  async getFraudeAlertas(): Promise<FraudeAlerta[]> {
    return this.ai.getAlertas();
  }

  isAiApiError(error: unknown): error is AiApiError {
    return error instanceof AiApiError;
  }

  private buildDashboardFromIncapacidades(items: IncapacidadListItem[]): DashboardSummary {
    const inProgress = items.filter((item) => item.estado === AiResultStatus.Pending || item.estado === AiResultStatus.ManualReview).length;
    const approved = items.filter((item) => item.estado === AiResultStatus.Approved).length;
    const rejected = items.filter((item) => item.estado === AiResultStatus.Rejected).length;

    return {
      metrics: [
        { label: 'En proceso', value: inProgress, icon: 'pi pi-sync' },
        { label: 'Aprobados', value: approved, icon: 'pi pi-check-circle' },
        { label: 'Glosas', value: items.filter((item) => item.anomaliasDetectadas.length > 0).length, icon: 'pi pi-exclamation-circle' },
        { label: 'Rechazados', value: rejected, icon: 'pi pi-times-circle' },
      ],
      recentRequirements: items
        .filter((item) => item.estado === AiResultStatus.ManualReview)
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          title: item.datosExtraidos?.pacienteNombre ?? item.id,
          status: 'Pendiente',
        })),
      recentGlosas: items
        .flatMap((item) => item.anomaliasDetectadas.map((detail, index) => ({ id: `${item.id}-${index}`, code: item.id.slice(0, 8).toUpperCase(), detail })))
        .slice(0, 3),
      finalResults: items
        .filter((item) => item.estado === AiResultStatus.Approved)
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          status: EpsResponseStatus.Approved,
          date: item.fechaProcesamiento?.slice(0, 10) ?? '',
        })),
    };
  }

  private mapAiStatusToValidation(status: AiResultStatus): IntakeValidationStatus {
    if (status === AiResultStatus.Approved) return IntakeValidationStatus.Valid;
    if (status === AiResultStatus.Rejected) return IntakeValidationStatus.Invalid;
    if (status === AiResultStatus.ManualReview || status === AiResultStatus.Pending) return IntakeValidationStatus.Warning;
    return IntakeValidationStatus.Pending;
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
