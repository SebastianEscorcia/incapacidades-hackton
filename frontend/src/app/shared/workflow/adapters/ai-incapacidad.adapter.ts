import {
  AiBackendEstado,
  FraudeAlerta,
  IncapacidadDetail,
  IncapacidadExtractedData,
  IncapacidadListItem,
  IncapacidadUploadResult,
  RethusVerificacion,
} from '../types/ai.types';
import { AiResultStatus, IntakeValidationStatus } from '../types/workflow.enums';
import { AiValidationMetric, AiResultSummary } from '../types/workflow.types';
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
    };
  }

  static uploadToIntakeFile(result: IncapacidadUploadResult, file: File): IntakeFileResponse {
    let validationStatus = IntakeValidationStatus.Valid;
    let validationMessage: string | undefined;

    if (result.estado === AiResultStatus.Rejected) {
      validationStatus = IntakeValidationStatus.Invalid;
      validationMessage = result.alertas[0] ?? result.mensaje;
    } else if (result.estado === AiResultStatus.ManualReview || result.estado === AiResultStatus.Pending) {
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
      datosExtraidos: this.toExtractedData(datosRaw),
      confidence: this.estimateConfidence(estado, findings.length),
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
    };
  }

  static toMetrics(detail: IncapacidadDetail): AiValidationMetric[] {
    const anomalyScore = Math.max(35, 100 - detail.anomaliasDetectadas.length * 12);
    const estadoScore =
      detail.estado === AiResultStatus.Approved ? 95 : detail.estado === AiResultStatus.Rejected ? 40 : 72;

    return [
      {
        id: 'ocr',
        label: 'Confianza OCR / extracción',
        score: detail.datosExtraidos ? 90 : 60,
        status: detail.datosExtraidos ? IntakeValidationStatus.Valid : IntakeValidationStatus.Warning,
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
        score: estadoScore,
        status:
          detail.estado === AiResultStatus.Rejected
            ? IntakeValidationStatus.Invalid
            : detail.anomaliasDetectadas.length
              ? IntakeValidationStatus.Warning
              : IntakeValidationStatus.Valid,
      },
      {
        id: 'rethus',
        label: 'Verificación RETHUS',
        score: detail.requiereVerificacionRethus ? 55 : 92,
        status: detail.requiereVerificacionRethus ? IntakeValidationStatus.Warning : IntakeValidationStatus.Valid,
      },
      {
        id: 'completeness',
        label: 'Completitud clínica',
        score: detail.datosExtraidos ? 88 : 50,
        status: detail.datosExtraidos ? IntakeValidationStatus.Valid : IntakeValidationStatus.Warning,
      },
    ];
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

  private static estimateConfidence(estado: AiResultStatus, findingsCount: number): number {
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
