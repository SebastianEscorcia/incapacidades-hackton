export interface ManualReviewPayload {
  validateAnomalies: boolean;
  reviewFraud: boolean;
  reviewCoherence: boolean;
  reviewQuality: boolean;
  requiresCompanyAction: boolean;
  decisionNotes: string;
}
