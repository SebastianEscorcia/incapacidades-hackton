import { EpsResponsePayload, EpsResponseStatus } from '../types';
import { ApiRecord, apiString } from './api.helpers';

export class EpsResponseAdapter {
  static toPayload(model: EpsResponsePayload): ApiRecord {
    return { ...model };
  }

  static fromApi(raw: ApiRecord): EpsResponsePayload {
    return {
      status: apiString(raw, 'status', EpsResponseStatus.Approved) as EpsResponseStatus,
      responseCode: apiString(raw, 'responseCode'),
      notes: apiString(raw, 'notes'),
      correctionNotes: apiString(raw, 'correctionNotes') || undefined,
    };
  }
}
