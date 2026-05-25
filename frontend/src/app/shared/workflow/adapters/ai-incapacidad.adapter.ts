import {
  AiBackendEstado,
  AdresVerificacion,
  DashboardEstadosEpsSummary,
  EpsResponseCompletedEvent,
  EpsResponseInfo,
  FraudeAlerta,
  IncapacidadDetail,
  IncapacidadExtractedData,
  IncapacidadListItem,
  IncapacidadUploadResult,
  RethusVerificacion,
  ScrapingResults,
  ScrapingValidationEntry,
  AiScrapingCompletedEvent,
} from '../types/ai.types';
import { AiResultStatus, EpsResponseStatus, IntakeValidationStatus } from '../types/workflow.enums';
import { AiValidationMetric, AiResultSummary, ValidationCheck, PreprocessingTask } from '../types/workflow.types';
import { IntakeFileResponse } from '../types/responses/intake.response';
import { DocumentFileType } from '../types/workflow.enums';
import { ApiRecord, apiArray, apiBoolean, apiNumber, apiString } from './api.helpers';

export class AiIncapacidadAdapter {
  static mapEstado(raw: string): AiResultStatus {
    const normalized = raw.trim().toUpperCase();
    if (normalized === AiBackendEstado.Aprobado) return AiResultStatus.Approved;
    if (normalized === AiBackendEstado.Rechazado) return AiResultStatus.Rejected;
    if (normalized === AiBackendEstado.Pendiente) return AiResultStatus.Pending;
    return AiResultStatus.ManualReview;
  }

  static mapEstadoEps(raw: string): EpsResponseStatus {
    const normalized = raw.trim().toUpperCase();
    if (normalized === 'EN_PROCESO') return EpsResponseStatus.InProcess;
    if (normalized === 'APROBADO') return EpsResponseStatus.Approved;
    if (normalized === 'GLOSA') return EpsResponseStatus.Glosa;
    if (normalized === 'RECHAZADO') return EpsResponseStatus.Rejected;
    if (normalized === 'REQUIERE_SOPORTE') return EpsResponseStatus.RequiresSupport;
    return EpsResponseStatus.InProcess;
  }

  static uploadResponse(raw: ApiRecord, file: File): IncapacidadUploadResult {
    const alertas = apiArray(raw, 'alertas').map((item) =>
      typeof item === 'string' ? item : apiString(item as ApiRecord, 'message', apiString(item as ApiRecord, 'descripcion')),
    );

    return {
      id: apiString(raw, 'id'),
      mensaje: apiString(raw, 'mensaje'),
      estado: this.mapEstado(apiString(raw, 'estado', apiString(raw, 'estado_ia'))),
      requiereAccionManual: apiBoolean(raw, 'requiere_accion_manual'),
      alertas,
      scraping: this.toScraping(raw),
      epsResponse: this.toEpsResponse(raw),
    };
  }

  static uploadToIntakeFile(result: IncapacidadUploadResult, file: File): IntakeFileResponse {
    let validationStatus = IntakeValidationStatus.Valid;
    let validationMessage: string | undefined;

    if (result.estado === AiResultStatus.Rejected) {
      validationStatus = IntakeValidationStatus.Invalid;
      validationMessage = result.alertas[0] ?? result.mensaje;
    } else if (result.estado === AiResultStatus.Pending) {
      validationStatus = IntakeValidationStatus.Pending;
      validationMessage = result.mensaje || undefined;
    } else if (result.estado === AiResultStatus.ManualReview) {
      validationStatus = IntakeValidationStatus.Invalid;
      validationMessage = result.mensaje || result.alertas[0] || 'Requiere revisión manual';
    } else if (result.alertas.length) {
      validationStatus = IntakeValidationStatus.Warning;
      validationMessage = result.alertas[0];
    }

    return {
      id: result.id,
      name: file.name,
      type: this.inferFileType(file),
      sizeBytes: file.size,
      validationStatus,
      validationMessage,
    };
  }

  static toDetail(raw: ApiRecord): IncapacidadDetail {
    const anomalias = apiArray(raw, 'anomalias_detectadas').map((item) =>
      typeof item === 'string' ? item : apiString(item as ApiRecord, 'descripcion'),
    );
    const alertas = apiArray(raw, 'alertas').map((item) =>
      typeof item === 'string' ? item : apiString(item as ApiRecord, 'descripcion'),
    );
    const findings = [...anomalias, ...alertas].filter(Boolean);
    const estado = this.mapEstado(apiString(raw, 'estado_ia', apiString(raw, 'estado')));
    const datosRaw = (raw['datos_extraidos'] as ApiRecord | undefined) ?? {};

    return {
      id: apiString(raw, 'id'),
      estado,
      motivo: apiString(raw, 'motivo') || undefined,
      anomaliasDetectadas: anomalias,
      fechaProcesamiento: apiString(raw, 'fecha_procesamiento'),
      requiereVerificacionRethus: apiBoolean(raw, 'requiere_verificacion_rethus'),
      estadoEpsResponse: this.mapEstadoEps(
        apiString(raw, 'estado_eps_response', apiString(raw, 'estado_eps', 'EN_PROCESO')),
      ),
      mensajeEpsResponse: apiString(raw, 'mensaje_eps_response') || undefined,
      requiereRequerimientoEps: apiBoolean(raw, 'requiere_requerimiento_eps'),
      datosExtraidos: this.toExtractedData(datosRaw),
      scraping: this.toScraping(raw),
      confidence: this.estimateConfidence(estado, findings.length, Boolean(this.toExtractedData(datosRaw))),
      findings,
    };
  }

  static toList(raw: ApiRecord): IncapacidadListItem[] {
    if (Array.isArray(raw)) {
      return (raw as ApiRecord[]).map((item) => this.toDetail(item));
    }
    return apiArray(raw, 'items').map((item) => this.toDetail(item));
  }

  static toAiResultSummary(detail: IncapacidadDetail): AiResultSummary {
    return {
      status: detail.estado,
      confidence: detail.confidence,
      findings: detail.findings,
      incapacidadId: detail.id,
      motivo: detail.motivo,
      datosExtraidos: detail.datosExtraidos,
      requiereVerificacionRethus: detail.requiereVerificacionRethus,
      fechaProcesamiento: detail.fechaProcesamiento,
      scraping: detail.scraping,
      epsResponse: {
        estadoEpsResponse: detail.estadoEpsResponse,
        mensaje: detail.mensajeEpsResponse ?? '',
        requiereRequerimiento: detail.requiereRequerimientoEps,
      },
    };
  }

  /** El backend terminó pero no extrajo datos útiles (fallo real de procesamiento). */
  static isProcessingFailed(detail: IncapacidadDetail): boolean {
    if (detail.estado === AiResultStatus.Pending) return false;
    return !detail.datosExtraidos;
  }

  static toPreprocessingTasks(
    detail: IncapacidadDetail,
    scraping?: ScrapingResults,
    scrapingPending = false,
  ): PreprocessingTask[] {
    const failed = this.isProcessingFailed(detail);
    const pending = detail.estado === AiResultStatus.Pending;
    const hasData = Boolean(detail.datosExtraidos);
    const scrapingDone = scraping ? this.isScrapingComplete(scraping) : false;
    const failReason = detail.motivo ?? 'No se pudo procesar el documento';

    const state = (done: boolean, forceFailed = false) => this.taskState(done, failed || forceFailed, pending);

    return [
      {
        id: '1',
        label: 'OCR',
        state: state(hasData),
        detail: failed ? failReason : hasData ? 'Texto extraído' : pending ? 'En procesamiento' : undefined,
      },
      {
        id: '2',
        label: 'Extracción IA',
        state: state(hasData),
        detail: failed ? failReason : hasData ? 'Datos clínicos detectados' : pending ? 'En procesamiento' : undefined,
      },
      {
        id: '3',
        label: 'Validación documental',
        state: state(hasData && detail.estado !== AiResultStatus.Rejected),
        detail: failed ? failReason : detail.findings[0],
      },
      {
        id: '4',
        label: 'Motor antifraude',
        state: state(hasData),
        detail: failed ? failReason : detail.findings[0],
      },
      {
        id: '5',
        label: 'Scraping RETHUS',
        state: failed ? 'failed' : scraping?.rethus ? 'completed' : pending || scrapingPending ? 'pending' : 'failed',
        detail: failed
          ? 'No ejecutado — procesamiento fallido'
          : scraping?.rethus?.error ?? (scraping?.rethus ? undefined : scrapingPending ? 'Validando registro médico…' : 'Sin resultado'),
      },
      {
        id: '6',
        label: 'Scraping ADRES',
        state: failed ? 'failed' : scraping?.adres ? 'completed' : pending || scrapingPending ? 'pending' : 'failed',
        detail: failed
          ? 'No ejecutado — procesamiento fallido'
          : scraping?.adres?.error ?? (scraping?.adres ? undefined : scrapingPending ? 'Validando afiliación EPS…' : 'Sin resultado'),
      },
      {
        id: '7',
        label: 'Consolidación validaciones externas',
        state: failed ? 'failed' : scrapingDone ? 'completed' : pending || scrapingPending ? 'pending' : 'failed',
        detail: failed
          ? failReason
          : scrapingDone
            ? 'RETHUS y ADRES finalizados'
            : scrapingPending
              ? 'Validando RETHUS y ADRES…'
              : 'Sin validaciones externas',
      },
    ];
  }

  static toMetrics(detail: IncapacidadDetail, scrapingOverride?: ScrapingResults): AiValidationMetric[] {
    if (this.isProcessingFailed(detail)) {
      return this.failedMetrics(detail, scrapingOverride ?? detail.scraping);
    }
    if (detail.estado === AiResultStatus.Pending) {
      return this.pendingMetrics(scrapingOverride ?? detail.scraping);
    }
    return this.successMetrics(detail, scrapingOverride ?? detail.scraping);
  }

  static toFraudeAlertas(raw: ApiRecord): FraudeAlerta[] {
    const source = Array.isArray(raw) ? (raw as ApiRecord[]) : apiArray(raw, 'alertas');
    return source.map((item, index) => ({
      id: apiString(item, 'id', `alert-${index}`),
      tipoAlerta: apiString(item, 'tipo_alerta'),
      severidad: apiString(item, 'severidad'),
      descripcion: apiString(item, 'descripcion'),
      fecha: apiString(item, 'fecha'),
    }));
  }

  static toRethus(raw: ApiRecord): RethusVerificacion {
    return {
      registroMedico: apiString(raw, 'registro_medico'),
      nombreMedico: apiString(raw, 'nombre_medico'),
      estado: apiString(raw, 'estado'),
      existe: apiBoolean(raw, 'existe'),
    };
  }

  static toAdres(raw: ApiRecord): AdresVerificacion {
    const estado = apiString(raw, 'estado_afiliacion', apiString(raw, 'estado', apiString(raw, 'regimen')));
    const activo = apiBoolean(raw, 'activo', apiBoolean(raw, 'existe', estado.toUpperCase() === 'ACTIVO'));

    return {
      pacienteDocumento: apiString(raw, 'paciente_documento', apiString(raw, 'documento')),
      eps: apiString(raw, 'eps') || undefined,
      estadoAfiliacion: estado,
      activo,
      payload: raw,
    };
  }

  static toScraping(raw: ApiRecord): ScrapingResults | undefined {
    const scrapingRaw = (raw['scraping'] as ApiRecord | undefined) ?? raw;

    const rethus = this.toScrapingEntry(scrapingRaw['rethus'] as ApiRecord | undefined);
    const adres = this.toScrapingEntry(scrapingRaw['adres'] as ApiRecord | undefined);
    if (!rethus && !adres) return undefined;

    const scraping: ScrapingResults = {};
    if (rethus) scraping.rethus = rethus;
    if (adres) scraping.adres = adres;
    scraping.completed = this.isScrapingComplete(scraping);
    return scraping;
  }

  static mergeScraping(current: ScrapingResults | undefined, incoming: ScrapingResults): ScrapingResults {
    const merged: ScrapingResults = {
      rethus: incoming.rethus ?? current?.rethus,
      adres: incoming.adres ?? current?.adres,
    };
    merged.completed = incoming.completed ?? this.isScrapingComplete(merged);
    return merged;
  }

  static isScrapingComplete(scraping?: ScrapingResults): boolean {
    if (!scraping) return false;
    if (scraping.completed) return true;
    return Boolean(scraping.rethus && scraping.adres);
  }

  static toInstitutionalChecks(detail: IncapacidadDetail, scraping?: ScrapingResults): ValidationCheck[] {
    if (this.isProcessingFailed(detail)) {
      const reason = detail.motivo ?? 'No se pudo procesar el documento';
      return [
        { id: '1', label: 'Médico en RETHUS (scraping)', passed: false, detail: reason },
        { id: '2', label: 'Afiliación ADRES / EPS', passed: false, detail: reason },
        { id: '3', label: 'IPS/prestador en REPS', passed: false, detail: reason },
        { id: '4', label: 'Validación gubernamental futura', passed: false, detail: reason },
        { id: '5', label: 'Coherencia datos usuario', passed: false, detail: reason },
      ];
    }

    const activeScraping = scraping ?? detail.scraping;
    const rethus = activeScraping?.rethus;
    const adres = activeScraping?.adres;
    const rethusPayload = rethus?.payload ?? {};
    const adresPayload = adres?.payload ?? {};

    return [
      {
        id: '1',
        label: 'Médico en RETHUS (scraping)',
        passed: rethus ? rethus.status : !detail.requiereVerificacionRethus,
        detail: rethus
          ? this.scrapingDetail(rethus, 'RETHUS') ?? apiString(rethusPayload, 'nombre_medico')
          : detail.requiereVerificacionRethus
            ? 'Pendiente de validación externa'
            : undefined,
      },
      {
        id: '2',
        label: 'Afiliación ADRES / EPS',
        passed: adres ? adres.status : Boolean(detail.datosExtraidos?.eps),
        detail: adres
          ? this.scrapingDetail(adres, 'ADRES') ?? apiString(adresPayload, 'estado_afiliacion')
          : detail.datosExtraidos?.eps,
      },
      { id: '3', label: 'IPS/prestador en REPS', passed: Boolean(detail.datosExtraidos?.ipsNombre), detail: detail.datosExtraidos?.ipsNombre },
      { id: '4', label: 'Validación gubernamental futura', passed: true },
      {
        id: '5',
        label: 'Coherencia datos usuario',
        passed: detail.anomaliasDetectadas.length === 0,
        detail: detail.anomaliasDetectadas[0],
      },
    ];
  }

  static toScrapingCompletedEvent(raw: ApiRecord): AiScrapingCompletedEvent | null {
    const id = apiString(raw, 'incapacidadId', apiString(raw, 'incapacidad_id', apiString(raw, 'id')));
    const scraping = this.toScraping(raw);
    if (!id || !scraping) return null;

    const estadoRaw = apiString(raw, 'estado_ia', apiString(raw, 'estado'));
    return {
      id,
      incapacidadId: id,
      estado: estadoRaw ? this.mapEstado(estadoRaw) : undefined,
      scraping: { ...scraping, completed: true },
      timestamp: apiString(raw, 'finalizadoEn', apiString(raw, 'timestamp')) || undefined,
      mensaje: apiString(raw, 'mensaje') || undefined,
    };
  }

  static toEpsResponseCompletedEvent(raw: ApiRecord): EpsResponseCompletedEvent | null {
    const incapacidadId = apiString(raw, 'incapacidadId', apiString(raw, 'incapacidad_id'));
    const estadoRaw = apiString(raw, 'estado_eps_response');
    if (!incapacidadId || !estadoRaw) return null;

    return {
      incapacidadId,
      estadoEpsResponse: this.mapEstadoEps(estadoRaw),
      mensaje: apiString(raw, 'mensaje'),
      requiereRequerimiento: apiBoolean(raw, 'requiere_requerimiento'),
      finalizadoEn: apiString(raw, 'finalizadoEn') || undefined,
    };
  }

  static toDashboardEstadosEpsSummary(raw: ApiRecord): DashboardEstadosEpsSummary {
    return {
      enProceso: apiNumber(raw, 'en_proceso'),
      glosa: apiNumber(raw, 'glosa'),
      rechazado: apiNumber(raw, 'rechazado'),
      requiereSoporte: apiNumber(raw, 'requiere_soporte'),
      aprobado: apiNumber(raw, 'aprobado'),
      total: apiNumber(raw, 'total'),
    };
  }

  static toEpsResponse(raw: ApiRecord): EpsResponseInfo | undefined {
    const source = (raw['eps_response'] as ApiRecord | undefined) ?? raw;
    const estadoRaw = apiString(source, 'estado_eps_response');
    if (!estadoRaw) return undefined;

    return {
      estadoEpsResponse: this.mapEstadoEps(estadoRaw),
      mensaje: apiString(source, 'mensaje'),
      requiereRequerimiento: apiBoolean(source, 'requiere_requerimiento'),
    };
  }

  private static toScrapingEntry(raw: ApiRecord | undefined): ScrapingValidationEntry | undefined {
    if (!raw) return undefined;
    return {
      status: apiBoolean(raw, 'status'),
      payload: (raw['payload'] as ApiRecord | undefined) ?? {},
      error: apiString(raw, 'error') || undefined,
    };
  }

  private static taskState(
    done: boolean,
    failed: boolean,
    pending: boolean,
  ): PreprocessingTask['state'] {
    if (failed) return 'failed';
    if (done) return 'completed';
    if (pending) return 'pending';
    return 'failed';
  }

  private static failedMetrics(detail: IncapacidadDetail, scraping?: ScrapingResults): AiValidationMetric[] {
    const reason = detail.motivo ?? 'No se pudo procesar el documento';
    const invalid = (id: string, label: string, detailText?: string): AiValidationMetric => ({
      id,
      label,
      score: 0,
      status: IntakeValidationStatus.Invalid,
      detail: detailText ?? reason,
    });

    return [
      invalid('ocr', 'Confianza OCR / extracción'),
      invalid('consistency', 'Consistencia documental'),
      invalid('fraud', 'Motor antifraude'),
      invalid(
        'rethus',
        'Scraping RETHUS (médico)',
        scraping?.rethus?.error ?? 'No ejecutado — procesamiento fallido',
      ),
      invalid(
        'adres',
        'Scraping ADRES (afiliación EPS)',
        scraping?.adres?.error ?? 'No ejecutado — procesamiento fallido',
      ),
      invalid('completeness', 'Completitud clínica'),
    ];
  }

  private static pendingMetrics(scraping?: ScrapingResults): AiValidationMetric[] {
    const pending = (id: string, label: string): AiValidationMetric => ({
      id,
      label,
      score: 0,
      status: IntakeValidationStatus.Pending,
      detail: 'En procesamiento',
    });

    return [
      pending('ocr', 'Confianza OCR / extracción'),
      pending('consistency', 'Consistencia documental'),
      pending('fraud', 'Motor antifraude'),
      {
        id: 'rethus',
        label: 'Scraping RETHUS (médico)',
        score: 0,
        status: scraping?.rethus ? this.scrapingStatus(scraping.rethus) : IntakeValidationStatus.Pending,
        detail: scraping?.rethus ? this.scrapingDetail(scraping.rethus, 'RETHUS') : 'En procesamiento',
      },
      {
        id: 'adres',
        label: 'Scraping ADRES (afiliación EPS)',
        score: 0,
        status: scraping?.adres ? this.scrapingStatus(scraping.adres) : IntakeValidationStatus.Pending,
        detail: scraping?.adres ? this.scrapingDetail(scraping.adres, 'ADRES') : 'En procesamiento',
      },
      pending('completeness', 'Completitud clínica'),
    ];
  }

  private static successMetrics(detail: IncapacidadDetail, scraping?: ScrapingResults): AiValidationMetric[] {
    const data = detail.datosExtraidos!;
    const completeness = this.computeCompleteness(data);
    const anomalyScore = Math.max(0, 100 - detail.anomaliasDetectadas.length * 15);

    return [
      {
        id: 'ocr',
        label: 'Confianza OCR / extracción',
        score: 90,
        status: IntakeValidationStatus.Valid,
      },
      {
        id: 'consistency',
        label: 'Consistencia documental',
        score: anomalyScore,
        status: detail.anomaliasDetectadas.length ? IntakeValidationStatus.Warning : IntakeValidationStatus.Valid,
        detail: detail.anomaliasDetectadas[0],
      },
      {
        id: 'fraud',
        label: 'Motor antifraude',
        score:
          detail.estado === AiResultStatus.Approved ? 95 : detail.estado === AiResultStatus.Rejected ? 25 : 70,
        status:
          detail.estado === AiResultStatus.Rejected
            ? IntakeValidationStatus.Invalid
            : detail.anomaliasDetectadas.length
              ? IntakeValidationStatus.Warning
              : IntakeValidationStatus.Valid,
        detail: detail.motivo,
      },
      {
        id: 'rethus',
        label: 'Scraping RETHUS (médico)',
        score: this.scrapingScore(scraping?.rethus),
        status: this.scrapingStatus(scraping?.rethus, detail.requiereVerificacionRethus),
        detail: this.scrapingDetail(scraping?.rethus, 'RETHUS'),
      },
      {
        id: 'adres',
        label: 'Scraping ADRES (afiliación EPS)',
        score: this.scrapingScore(scraping?.adres),
        status: this.scrapingStatus(scraping?.adres, Boolean(data.eps)),
        detail: this.scrapingDetail(scraping?.adres, 'ADRES'),
      },
      {
        id: 'completeness',
        label: 'Completitud clínica',
        score: completeness,
        status: completeness >= 80 ? IntakeValidationStatus.Valid : IntakeValidationStatus.Warning,
      },
    ];
  }

  private static computeCompleteness(data: IncapacidadExtractedData): number {
    const fields = [
      data.pacienteNombre,
      data.pacienteDocumento,
      data.eps,
      data.diagnosticoCodigo,
      data.diasIncapacidad,
      data.fechaInicio,
      data.medicoNombre,
      data.ipsNombre,
    ];
    const filled = fields.filter((value) => value !== undefined && value !== null && value !== '').length;
    return Math.round((filled / fields.length) * 100);
  }

  private static scrapingScore(entry?: ScrapingValidationEntry): number {
    if (!entry) return 0;
    return entry.status ? 94 : 38;
  }

  private static scrapingStatus(
    entry?: ScrapingValidationEntry,
    required = false,
  ): IntakeValidationStatus {
    if (!entry) {
      return required ? IntakeValidationStatus.Pending : IntakeValidationStatus.Invalid;
    }
    return entry.status ? IntakeValidationStatus.Valid : IntakeValidationStatus.Invalid;
  }

  private static scrapingDetail(entry?: ScrapingValidationEntry, source?: string): string | undefined {
    if (!entry) return undefined;
    if (entry.error) return entry.error;

    const payload = entry.payload;
    if (source === 'RETHUS') {
      const nombre = apiString(payload, 'nombre_medico');
      const estado = apiString(payload, 'estado');
      if (nombre || estado) return [nombre, estado].filter(Boolean).join(' — ');
    }
    if (source === 'ADRES') {
      const eps = apiString(payload, 'eps');
      const estado = apiString(payload, 'estado_afiliacion', apiString(payload, 'estado'));
      if (eps || estado) return [eps, estado].filter(Boolean).join(' — ');
    }

    return entry.status ? 'Validación externa exitosa' : 'Validación externa fallida';
  }

  private static toExtractedData(raw: ApiRecord): IncapacidadExtractedData | undefined {
    const pacienteNombre = apiString(raw, 'paciente_nombre');
    if (!pacienteNombre) return undefined;

    return {
      pacienteNombre,
      pacienteDocumento: apiString(raw, 'paciente_documento'),
      eps: apiString(raw, 'eps'),
      diagnosticoCodigo: apiString(raw, 'diagnostico_codigo'),
      diasIncapacidad: apiNumber(raw, 'dias_incapacidad'),
      fechaInicio: apiString(raw, 'fecha_inicio'),
      fechaFin: apiString(raw, 'fecha_fin'),
      medicoNombre: apiString(raw, 'medico_nombre'),
      medicoRegistroDocumento: apiString(raw, 'medico_registro_documento'),
      ipsNombre: apiString(raw, 'ips_nombre'),
    };
  }

  private static estimateConfidence(estado: AiResultStatus, findingsCount: number, hasData: boolean): number {
    if (!hasData) {
      if (estado === AiResultStatus.Rejected) return 15;
      if (estado === AiResultStatus.Pending) return 0;
      return 10;
    }
    if (estado === AiResultStatus.Approved) return Math.max(85, 98 - findingsCount * 3);
    if (estado === AiResultStatus.Rejected) return Math.max(20, 55 - findingsCount * 4);
    if (estado === AiResultStatus.Pending) return 50;
    return Math.max(45, 80 - findingsCount * 6);
  }

  private static inferFileType(file: File): DocumentFileType {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return DocumentFileType.Pdf;
    if (/\.(jpg|jpeg|png|webp)$/.test(name)) return DocumentFileType.Image;
    return DocumentFileType.Pdf;
  }
}
