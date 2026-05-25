import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AiIncapacidadAdapter } from '../adapters/ai-incapacidad.adapter';
import {
  DashboardEstadosEpsSummary,
  EpsResponseInfo,
  EpsSimulationRequest,
  FraudeAlerta,
  IncapacidadDetail,
  IncapacidadListFilters,
  IncapacidadListItem,
  IncapacidadUploadResult,
  RethusVerificacion,
} from '../types/ai.types';
import { ApiRecord } from '../adapters/api.helpers';
import { AiResultStatus } from '../types/workflow.enums';

export class AiApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AiApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class AiIncapacidadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ai`;
  static readonly maxFileSizeBytes = 5 * 1024 * 1024;
  static readonly allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

  validateFile(file: File): string | null {
    if (file.size > AiIncapacidadService.maxFileSizeBytes) {
      return 'El archivo supera el tamaño permitido de 5MB.';
    }
    const allowedExt = /\.(pdf|jpg|jpeg|png)$/i;
    if (!allowedExt.test(file.name)) {
      return 'Tipo de archivo no soportado. Usa JPG, PNG o PDF.';
    }
    return null;
  }

  async uploadDocumento(file: File): Promise<IncapacidadUploadResult> {
    const validationError = this.validateFile(file);
    if (validationError) {
      throw new AiApiError(validationError, 400);
    }

    const formData = new FormData();
    formData.append('documento', file);

    try {
      const raw = await firstValueFrom(
        this.http.post<ApiRecord>(`${this.baseUrl}/upload-incapacidad`, formData),
      );
      return AiIncapacidadAdapter.uploadResponse(raw, file);
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  async getIncapacidad(id: string): Promise<IncapacidadDetail> {
    try {
      const raw = await firstValueFrom(this.http.get<ApiRecord>(`${this.baseUrl}/incapacidad/${id}`));
      return AiIncapacidadAdapter.toDetail(raw);
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  async listIncapacidades(filters: IncapacidadListFilters = {}): Promise<IncapacidadListItem[]> {
    try {
      const raw = await firstValueFrom(
        this.http.get<ApiRecord | ApiRecord[]>(`${this.baseUrl}/incapacidades`, {
          params: this.toQueryParams(filters),
        }),
      );
      return AiIncapacidadAdapter.toList(Array.isArray(raw) ? { items: raw } : raw);
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  async getDashboardResumenEstados(): Promise<DashboardEstadosEpsSummary> {
    try {
      const raw = await firstValueFrom(this.http.get<ApiRecord>(`${this.baseUrl}/dashboard/resumen-estados`));
      return AiIncapacidadAdapter.toDashboardEstadosEpsSummary(raw);
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  async simularRespuestaEps(payload: EpsSimulationRequest): Promise<EpsResponseInfo> {
    try {
      const raw = await firstValueFrom(
        this.http.post<ApiRecord>(`${environment.apiUrl}/eps-ai/simular-respuesta`, payload),
      );
      const epsResponse = AiIncapacidadAdapter.toEpsResponse(raw);
      if (!epsResponse) {
        throw new AiApiError('La simulación EPS no retornó un resultado válido.', 500);
      }
      return epsResponse;
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  async getAlertas(): Promise<FraudeAlerta[]> {
    throw new AiApiError('Endpoint /ai/alertas no está disponible en backend.', 501);
  }

  async verificarRethus(registroMedico: string): Promise<RethusVerificacion> {
    void registroMedico;
    throw new AiApiError(
      'Endpoint /ai/rethus/verificar no está disponible; RETHUS se valida dentro de /ai/upload-incapacidad.',
      501,
    );
  }

  async waitUntilProcessed(
    id: string,
    options: { intervalMs?: number; maxAttempts?: number } = {},
  ): Promise<IncapacidadDetail> {
    const intervalMs = options.intervalMs ?? 1500;
    const maxAttempts = options.maxAttempts ?? 20;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const detail = await this.getIncapacidad(id);
      if (detail.estado !== AiResultStatus.Pending) {
        return detail;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return this.getIncapacidad(id);
  }

  private toQueryParams(filters: IncapacidadListFilters): Record<string, string> {
    const params: Record<string, string> = {};
    if (filters.pacienteDocumento) params['paciente_documento'] = filters.pacienteDocumento;
    if (filters.pacienteNombre) params['paciente_nombre'] = filters.pacienteNombre;
    if (filters.eps) params['eps'] = filters.eps;
    if (filters.estadoIa) params['estado_ia'] = filters.estadoIa;
    if (filters.medicoDocumento) params['medico_documento'] = filters.medicoDocumento;
    return params;
  }

  private toApiError(error: unknown): AiApiError {
    if (error instanceof AiApiError) return error;
    if (error instanceof HttpErrorResponse) {
      const body = (error.error ?? {}) as ApiRecord;
      const message =
        typeof body['message'] === 'string'
          ? body['message']
          : error.message || 'Error al comunicarse con el servicio de IA.';
      return new AiApiError(message, error.status);
    }
    return new AiApiError('Error inesperado al comunicarse con el servicio de IA.');
  }
}
