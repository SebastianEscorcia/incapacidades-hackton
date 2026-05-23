import { DocumentFileType, IntakeValidationStatus } from '../workflow.enums';

export interface IntakeFileResponse {
  id: string;
  name: string;
  type: DocumentFileType;
  sizeBytes: number;
  validationStatus: IntakeValidationStatus;
  validationMessage?: string;
}
