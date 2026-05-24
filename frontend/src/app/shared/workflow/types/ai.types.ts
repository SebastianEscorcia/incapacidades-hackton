import { AiResultStatus } from './workflow.enums';

/** Estados devueltos por el backend (`/ai`). */
export enum AiBackendEstado {
  Aprobado = 'APROBADO',
  RevisionManual = 'REVISIÓN MANUAL',
  Rechazado = 'RECHAZADO',
  Pendiente = 'PENDIENTE',
}

export enum AiAlertaSeveridad {
  Alta = 'ALTA',
  Media = 'MEDIA',
  Baja = 'BAJA',
}

export interface IncapacidadExtractedData {
  pacienteNombre: string;
  pacienteDocumento: string;
  eps: string;
  diagnosticoCodigo: string;
  diasIncapacidad: number;
  fechaInicio: string;
  fechaFin: string;
  medicoNombre: string;
  medicoRegistroDocumento: string;
  ipsNombre: string;
}

export interface IncapacidadUploadResult {
  id: string;
  mensaje: string;
  estado: AiResultStatus;
  requiereAccionManual: boolean;
  alertas: string[];
}

export interface IncapacidadDetail {
  id: string;
  estado: AiResultStatus;
  motivo?: string;
  anomaliasDetectadas: string[];
  fechaProcesamiento: string;
  requiereVerificacionRethus: boolean;
  datosExtraidos?: IncapacidadExtractedData;
  confidence: number;
  findings: string[];
}

export interface IncapacidadListFilters {
  pacienteDocumento?: string;
  pacienteNombre?: string;
  eps?: string;
  estadoIa?: AiBackendEstado | string;
  medicoDocumento?: string;
}

export interface IncapacidadListItem extends IncapacidadDetail {}

export interface FraudeAlerta {
  id: string;
  tipoAlerta: string;
  severidad: AiAlertaSeveridad | string;
  descripcion: string;
  fecha: string;
}

export interface RethusVerificacion {
  registroMedico: string;
  nombreMedico: string;
  estado: string;
  existe: boolean;
}

export interface AiRealtimeFraudeEvent {
  mensaje: string;
  anomalias: string[];
  timestamp: string;
}
