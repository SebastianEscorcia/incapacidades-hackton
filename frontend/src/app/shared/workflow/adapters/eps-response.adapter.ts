import { EpsResponsePayload, EpsResponseStatus } from '../types';
import { ApiRecord, apiString } from './api.helpers';
import { AiIncapacidadAdapter } from './ai-incapacidad.adapter';

export class EpsResponseAdapter {
  static toPayload(model: EpsResponsePayload): ApiRecord {
    return { ...model };
  }

  static fromApi(raw: ApiRecord): EpsResponsePayload {
    const estadoRaw = apiString(raw, 'estado_eps_response', apiString(raw, 'status', 'EN_PROCESO'));
    const mappedStatus = AiIncapacidadAdapter.mapEstadoEps(estadoRaw);
    return {
      status: mappedStatus as EpsResponseStatus,
      responseCode: apiString(raw, 'responseCode', mappedStatus),
      notes: apiString(raw, 'mensaje', apiString(raw, 'notes')),
      correctionNotes: apiString(raw, 'correctionNotes') || undefined,
    };
  }
}
