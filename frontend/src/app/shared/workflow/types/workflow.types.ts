import {
  AiResultStatus,
  EpsResponseStatus,
  IntakeValidationStatus,
  WorkflowStage,
} from './workflow.enums';
import { IncapacidadExtractedData } from './ai.types';

export interface WorkflowStep {
  stage: WorkflowStage;
  label: string;
  route: string;
  icon: string;
}

export interface PreprocessingTask {
  id: string;
  label: string;
  completed: boolean;
  detail?: string;
}

export interface AiValidationMetric {
  id: string;
  label: string;
  score: number;
  status: IntakeValidationStatus;
  detail?: string;
}

export interface ValidationCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface WorkflowTimelineEvent {
  id: string;
  stage: WorkflowStage;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface DashboardMetric {
  label: string;
  value: number | string;
  trend?: string;
  icon: string;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  recentRequirements: { id: string; title: string; status: string }[];
  recentGlosas: { id: string; code: string; detail: string }[];
  finalResults: { id: string; status: AiResultStatus | EpsResponseStatus; date: string }[];
}

export interface AiResultSummary {
  status: AiResultStatus;
  confidence: number;
  findings: string[];
  incapacidadId?: string;
  motivo?: string;
  datosExtraidos?: IncapacidadExtractedData;
  requiereVerificacionRethus?: boolean;
  fechaProcesamiento?: string;
}
