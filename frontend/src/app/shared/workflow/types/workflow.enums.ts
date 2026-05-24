export enum WorkflowStage {
  Intake = 'intake',
  Preprocessing = 'preprocessing',
  AiValidation = 'ai-validation',
  AiResult = 'ai-result',
  ManualReview = 'manual-review',
  Requirement = 'requirement',
  BusinessValidation = 'business-validation',
  InstitutionalValidation = 'institutional-validation',
  Expediente = 'expediente',
  Radicacion = 'radicacion',
  EpsResponse = 'eps-response',
  Timeline = 'timeline',
}

export enum DocumentFileType {
  Pdf = 'pdf',
  Image = 'image',
  Excel = 'excel',
  Zip = 'zip',
  Metadata = 'metadata',
}

export enum IntakeValidationStatus {
  Pending = 'pending',
  Valid = 'valid',
  Invalid = 'invalid',
  Warning = 'warning',
}

export enum AiResultStatus {
  Approved = 'approved',
  Rejected = 'rejected',
  ManualReview = 'manual_review',
  Pending = 'pending',
}

export enum EpsResponseStatus {
  Approved = 'approved',
  Glosa = 'glosa',
  Rejected = 'rejected',
  RequiresSupport = 'requires_support',
}

export enum RadicacionChannel {
  Api = 'api',
  Portal = 'portal',
  Email = 'email',
  External = 'external',
  Operator = 'operator',
}

export enum RequirementAction {
  ReloadDoc = 'reload_doc',
  AttachSupport = 'attach_support',
  FixData = 'fix_data',
  NewEvidence = 'new_evidence',
}
