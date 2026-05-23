import { RadicacionChannel } from '../workflow.enums';

export interface RadicacionPayload {
  channel: RadicacionChannel;
  targetEntity: 'eps' | 'arl';
  referenceCode: string;
  notes: string;
}
