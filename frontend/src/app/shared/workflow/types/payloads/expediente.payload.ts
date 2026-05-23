export interface ExpedientePayload {
  documentIds: string[];
  metadata: Record<string, string>;
  includeAnnexes: boolean;
  auditNotes: string;
}
