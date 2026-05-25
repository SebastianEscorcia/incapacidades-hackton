import { AiResultStatus } from './workflow.enums';
import { EpsResponseStatus } from './workflow.enums';

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

export interface ScrapingValidationEntry {
  status: boolean;
  payload: Record<string, unknown>;
  error?: string;
}

export interface ScrapingResults {
  rethus?: ScrapingValidationEntry;
  adres?: ScrapingValidationEntry;
  /** true cuando RETHUS y ADRES terminaron (HTTP o WebSocket). */
  completed?: boolean;
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
  scraping?: ScrapingResults;
  epsResponse?: EpsResponseInfo;
}

export interface IncapacidadDetail {
  id: string;
  estado: AiResultStatus;
  motivo?: string;
  anomaliasDetectadas: string[];
  fechaProcesamiento: string;
  requiereVerificacionRethus: boolean;
  estadoEpsResponse: EpsResponseStatus;
  mensajeEpsResponse?: string;
  requiereRequerimientoEps: boolean;
  datosExtraidos?: IncapacidadExtractedData;
  scraping?: ScrapingResults;
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

export interface AdresVerificacion {
  pacienteDocumento: string;
  eps?: string;
  estadoAfiliacion: string;
  activo: boolean;
  payload: Record<string, unknown>;
}

export interface AiRealtimeFraudeEvent {
  mensaje: string;
  anomalias: string[];
  timestamp: string;
}

/** Evento WS emitido cuando terminan RETHUS + ADRES en paralelo. */
export interface AiScrapingCompletedEvent {
  id: string;
  incapacidadId?: string;
  estado?: AiResultStatus;
  scraping: ScrapingResults;
  timestamp?: string;
  mensaje?: string;
}

export interface EpsResponseInfo {
  estadoEpsResponse: EpsResponseStatus;
  mensaje: string;
  requiereRequerimiento: boolean;
}

export interface EpsResponseCompletedEvent {
  incapacidadId: string;
  estadoEpsResponse: EpsResponseStatus;
  mensaje: string;
  requiereRequerimiento: boolean;
  finalizadoEn?: string;
}

export interface DashboardEstadosEpsSummary {
  enProceso: number;
  glosa: number;
  rechazado: number;
  requiereSoporte: number;
  aprobado: number;
  total: number;
}

export interface EpsSimulationRequest {
  incapacidadId?: string;
  resultadoIA: {
    estado: string;
    anomalias_detectadas: string[];
    datos_extraidos: Record<string, unknown>;
  };
  scrapingResultados: {
    rethus: ScrapingValidationEntry;
    adres: ScrapingValidationEntry;
  };
}
