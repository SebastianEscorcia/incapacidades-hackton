import { EpsResponseStatus } from '../workflow.enums';

export interface EpsResponsePayload {
  status: EpsResponseStatus;
  responseCode: string;
  notes: string;
  correctionNotes?: string;
}
