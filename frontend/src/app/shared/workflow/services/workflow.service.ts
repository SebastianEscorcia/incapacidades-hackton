import { Injectable, inject } from '@angular/core';
import { AiIncapacidadAdapter } from '../adapters/ai-incapacidad.adapter';
import { EpsResponseAdapter } from '../adapters/eps-response.adapter';
import { IntakeAdapter } from '../adapters/intake.adapter';
import { ProcessingAdapter } from '../adapters/processing.adapter';
import { WorkflowAdapter } from '../adapters/workflow.adapter';
import { WorkflowFlowService } from './workflow-flow.service';
import { AiIncapacidadService, AiApiError } from './ai-incapacidad.service';
import { AiScrapingStateService } from './ai-scraping-state.service';
import { AiRealtimeService } from './ai-realtime.service';
import {
  AiResultStatus,
  AiResultSummary,
  AiValidationMetric,
  AiValidationContext,
  DashboardEstadosEpsSummary,
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
  ScrapingResults,
  ValidationCheck,
  WorkflowStage,
} from '../types';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly ai = inject(AiIncapacidadService);
  private readonly flow = inject(WorkflowFlowService);
  private readonly scrapingState = inject(AiScrapingStateService);
  private readonly realtime = inject(AiRealtimeService);

  async uploadIntake(model: IntakeUploadPayload, files: File[]): Promise<IntakeFileResponse[]> {
    void IntakeAdapter.toJsonPayload(model);
    if (!files.length) return [];

    const uploaded: IntakeFileResponse[] = [];
    const incapacidadIds: string[] = [];

    for (const file of files) {
      const result = await this.ai.uploadDocumento(file);
      this.scrapingState.setFromUpload(result.id, result.scraping);
      uploaded.push(AiIncapacidadAdapter.uploadToIntakeFile(result, file));
      incapacidadIds.push(result.id);
    }

    this.realtime.connect();

    const primaryId = incapacidadIds[0];
    this.flow.activeCase.update((current) => ({
      ...current,
      id: primaryId,
      incapacidadIds,
      primaryIncapacidadId: primaryId,
      scraping: this.scrapingState.get(primaryId),
      scrapingPending: this.scrapingState.isPending(primaryId),
      updatedAt: new Date().toISOString(),
    }));

    this.flow.addHistoryEvent(
      WorkflowStage.Intake,
      'Documento procesado',
      `${files.length} archivo(s) enviados a IA.`,
      'Sistema',
    );

    return uploaded;
  }

  async getIntakeValidations(): Promise<IntakeFileResponse[]> {
    const primaryId = this.requireIncapacidadId();
    const detail = await this.ai.getIncapacidad(primaryId);
    const failed = AiIncapacidadAdapter.isProcessingFailed(detail);
    return [
      {
        id: detail.id,
        name: `incapacidad-${detail.id.slice(0, 8)}`,
        type: DocumentFileType.Pdf,
        sizeBytes: 0,
        validationStatus: failed
          ? IntakeValidationStatus.Invalid
          : this.mapAiStatusToValidation(detail.estado),
        validationMessage: detail.motivo ?? detail.findings[0],
      },
    ];
  }

  async getPreprocessingTasks(): Promise<PreprocessingTask[]> {
    const primaryId = this.requireIncapacidadId();
    const detail = await this.ai.getIncapacidad(primaryId);
    const scraping = this.resolveScraping(primaryId, detail.scraping);
    return AiIncapacidadAdapter.toPreprocessingTasks(
      detail,
      scraping,
      this.scrapingState.isPending(primaryId),
    );
  }

  async getAiValidationContext(): Promise<AiValidationContext> {
    const primaryId = this.requireIncapacidadId();
    const detail = await this.ai.getIncapacidad(primaryId);
    const scraping = this.resolveScraping(primaryId, detail.scraping);
    const enriched = { ...detail, scraping };

    return {
      metrics: AiIncapacidadAdapter.toMetrics(enriched, scraping),
      processingFailed: AiIncapacidadAdapter.isProcessingFailed(enriched),
      processingPending: detail.estado === AiResultStatus.Pending,
      motivo: detail.motivo,
      estado: detail.estado,
      scrapingPending: this.scrapingState.isPending(primaryId),
    };
  }

  async getAiValidationMetrics(): Promise<AiValidationMetric[]> {
    const context = await this.getAiValidationContext();
    return context.metrics;
  }

  async getAiResult(): Promise<AiResultSummary> {
    const primaryId = this.requireIncapacidadId();
    const detail = await this.ai.getIncapacidad(primaryId);
    const scraping = this.resolveScraping(primaryId, detail.scraping);
    return AiIncapacidadAdapter.toAiResultSummary({ ...detail, scraping });
  }

  async submitManualReview(model: ManualReviewPayload): Promise<{ success: boolean }> {
    void ProcessingAdapter.manualReviewToPayload(model);
    throw new AiApiError('Manual review aún no está conectado al backend.', 501);
  }

  async submitRequirement(model: RequirementPayload): Promise<{ success: boolean }> {
    void WorkflowAdapter.requirementToPayload(model);
    throw new AiApiError('Requerimientos aún no están conectados al backend.', 501);
  }

  async getBusinessValidations(): Promise<ValidationCheck[]> {
    const primaryId = this.requireIncapacidadId();
    const detail = await this.ai.getIncapacidad(primaryId);

    if (AiIncapacidadAdapter.isProcessingFailed(detail)) {
      const reason = detail.motivo ?? 'No se pudo procesar el documento';
      return [
        { id: '1', label: 'Fechas coherentes', passed: false, detail: reason },
        { id: '2', label: 'Días incapacidad', passed: false, detail: reason },
        { id: '3', label: 'Duplicidad / alertas IA', passed: false, detail: reason },
        { id: '4', label: 'Documento completo', passed: false, detail: reason },
        { id: '5', label: 'Estado IA', passed: false, detail: reason },
      ];
    }

    return [
      {
        id: '1',
        label: 'Fechas coherentes',
        passed: !detail.anomaliasDetectadas.some((item) => item.toLowerCase().includes('fecha')),
        detail: detail.anomaliasDetectadas.find((item) => item.toLowerCase().includes('fecha')),
      },
      {
        id: '2',
        label: 'Días incapacidad',
        passed: Boolean(detail.datosExtraidos?.diasIncapacidad),
        detail: detail.datosExtraidos?.diasIncapacidad ? `${detail.datosExtraidos.diasIncapacidad} días` : undefined,
      },
      {
        id: '3',
        label: 'Duplicidad / alertas IA',
        passed: detail.findings.length === 0,
        detail: detail.findings[0],
      },
      {
        id: '4',
        label: 'Documento completo',
        passed: Boolean(detail.datosExtraidos),
      },
      {
        id: '5',
        label: 'Estado IA',
        passed: detail.estado === AiResultStatus.Approved,
        detail: detail.motivo,
      },
    ];
  }

  async getInstitutionalValidations(): Promise<ValidationCheck[]> {
    const primaryId = this.requireIncapacidadId();
    const detail = await this.ai.getIncapacidad(primaryId);
    const scraping = this.resolveScraping(primaryId, detail.scraping);
    return AiIncapacidadAdapter.toInstitutionalChecks({ ...detail, scraping }, scraping);
  }

  async submitExpediente(model: ExpedientePayload): Promise<{ success: boolean }> {
    void WorkflowAdapter.expedienteToPayload(model);
    throw new AiApiError('Expediente aún no está conectado al backend.', 501);
  }

  async submitRadicacion(model: RadicacionPayload): Promise<{ success: boolean }> {
    void WorkflowAdapter.radicacionToPayload(model);
    throw new AiApiError('Radicación aún no está conectada al backend.', 501);
  }

  async submitEpsResponse(model: EpsResponsePayload): Promise<EpsResponsePayload> {
    void model;
    const primaryId = this.flow.activeCase().primaryIncapacidadId;
    const detail = primaryId ? await this.ai.getIncapacidad(primaryId) : undefined;
    const scraping = primaryId ? this.getScraping(primaryId) : undefined;

    const response = await this.ai.simularRespuestaEps({
      incapacidadId: primaryId,
      resultadoIA: {
        estado: this.mapAiStatusToBackend(detail?.estado),
        anomalias_detectadas: detail?.anomaliasDetectadas ?? [],
        datos_extraidos: this.toBackendExtractedData(detail?.datosExtraidos),
      },
      scrapingResultados: {
        rethus: scraping?.rethus ?? { status: false, payload: {} },
        adres: scraping?.adres ?? { status: false, payload: {} },
      },
    });

    return EpsResponseAdapter.fromApi({
      estado_eps_response: response.estadoEpsResponse,
      mensaje: response.mensaje,
      requiere_requerimiento: response.requiereRequerimiento,
    });
  }

  async getTimeline(): Promise<never[]> {
    throw new AiApiError('Timeline aún no está conectado al backend.', 501);
  }

  async getDashboard(): Promise<DashboardSummary> {
    const [itemsResult, estadosResult] = await Promise.allSettled([
      this.withTimeout(this.ai.listIncapacidades(), 8000, [] as IncapacidadListItem[]),
      this.withTimeout(this.ai.getDashboardResumenEstados(), 8000, this.emptyDashboardEstados()),
    ]);

    const items = itemsResult.status === 'fulfilled' ? itemsResult.value : [];
    const estados =
      estadosResult.status === 'fulfilled'
        ? estadosResult.value
        : this.emptyDashboardEstados();

    return this.buildDashboardFromIncapacidades(items, estados);
  }

  async confirmStage(stage: WorkflowStage): Promise<{ success: boolean }> {
    this.flow.navigateNext(stage);
    return { success: true };
  }

  async listIncapacidades(filters: IncapacidadListFilters = {}): Promise<IncapacidadListItem[]> {
    return this.ai.listIncapacidades(filters);
  }

  async getFraudeAlertas(): Promise<FraudeAlerta[]> {
    throw new AiApiError('Alertas HTTP no disponibles; use evento realtime `alerta_fraude`.', 501);
  }

  getScraping(incapacidadId?: string): ScrapingResults | undefined {
    const id = incapacidadId ?? this.flow.activeCase().primaryIncapacidadId;
    if (!id) return undefined;
    return this.scrapingState.get(id);
  }

  isScrapingPending(incapacidadId?: string): boolean {
    const id = incapacidadId ?? this.flow.activeCase().primaryIncapacidadId;
    if (!id) return false;
    return this.scrapingState.isPending(id);
  }

  connectRealtime(): void {
    this.realtime.connect();
  }

  isAiApiError(error: unknown): error is AiApiError {
    return error instanceof AiApiError;
  }

  private requireIncapacidadId(): string {
    const id = this.flow.activeCase().primaryIncapacidadId;
    if (!id) {
      throw new AiApiError('No hay una incapacidad activa. Cargue un documento primero.', 400);
    }
    return id;
  }

  private buildDashboardFromIncapacidades(
    items: IncapacidadListItem[],
    estados: DashboardEstadosEpsSummary,
  ): DashboardSummary {
    return {
      metrics: [
        { label: 'En proceso', value: estados.enProceso, icon: 'pi pi-sync' },
        { label: 'Aprobados', value: estados.aprobado, icon: 'pi pi-check-circle' },
        { label: 'Glosas', value: estados.glosa, icon: 'pi pi-exclamation-circle' },
        { label: 'Rechazados', value: estados.rechazado, icon: 'pi pi-times-circle' },
      ],
      recentRequirements: items
        .filter((item) => item.requiereRequerimientoEps || item.estadoEpsResponse === EpsResponseStatus.RequiresSupport)
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          title: item.datosExtraidos?.pacienteNombre ?? item.id,
          status: item.estadoEpsResponse,
        })),
      recentGlosas: items
        .filter((item) => item.estadoEpsResponse === EpsResponseStatus.Glosa)
        .map((item) => ({
          id: item.id,
          code: item.id.slice(0, 8).toUpperCase(),
          detail: item.mensajeEpsResponse ?? item.anomaliasDetectadas[0] ?? 'Glosa registrada',
        }))
        .slice(0, 3),
      finalResults: items
        .filter((item) => item.estadoEpsResponse === EpsResponseStatus.Approved)
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          status: item.estadoEpsResponse,
          date: item.fechaProcesamiento?.slice(0, 10) ?? '',
        })),
    };
  }

  private emptyDashboardEstados(): DashboardEstadosEpsSummary {
    return {
      enProceso: 0,
      glosa: 0,
      rechazado: 0,
      requiereSoporte: 0,
      aprobado: 0,
      total: 0,
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race<T>([
        promise,
        new Promise<T>((resolve) => {
          timer = setTimeout(() => resolve(fallback), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private resolveScraping(incapacidadId: string, fromApi?: ScrapingResults): ScrapingResults | undefined {
    const cached = this.scrapingState.get(incapacidadId);
    if (cached && fromApi) {
      return AiIncapacidadAdapter.mergeScraping(fromApi, cached);
    }
    return cached ?? fromApi;
  }

  private mapAiStatusToValidation(status: AiResultStatus): IntakeValidationStatus {
    if (status === AiResultStatus.Approved) return IntakeValidationStatus.Valid;
    if (status === AiResultStatus.Rejected) return IntakeValidationStatus.Invalid;
    if (status === AiResultStatus.ManualReview || status === AiResultStatus.Pending) return IntakeValidationStatus.Warning;
    return IntakeValidationStatus.Pending;
  }

  private mapAiStatusToBackend(status?: AiResultStatus): string {
    if (status === AiResultStatus.Approved) return 'APROBADO';
    if (status === AiResultStatus.Rejected) return 'RECHAZADO';
    if (status === AiResultStatus.ManualReview) return 'REVISIÓN MANUAL';
    return 'PENDIENTE';
  }

  private toBackendExtractedData(data?: IncapacidadListItem['datosExtraidos']): Record<string, unknown> {
    if (!data) return {};
    return {
      paciente_nombre: data.pacienteNombre,
      paciente_documento: data.pacienteDocumento,
      eps: data.eps,
      diagnostico_codigo: data.diagnosticoCodigo,
      dias_incapacidad: data.diasIncapacidad,
      fecha_inicio: data.fechaInicio,
      fecha_fin: data.fechaFin,
      medico_nombre: data.medicoNombre,
      medico_registro_documento: data.medicoRegistroDocumento,
      ips_nombre: data.ipsNombre,
    };
  }
}
