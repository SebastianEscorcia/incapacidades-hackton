export interface IntakeUploadPayload {
  companyId: string;
  batchName: string;
  notes: string;
  metadata?: Record<string, string>;
  fileCount: number;
}
