import { WorkflowStage } from './types/workflow.enums';

export type WorkflowActor = 'empresa' | 'eps';
export type WorkflowOwner = WorkflowActor | 'shared';

export interface FlowStepConfig {
  stage: WorkflowStage;
  label: string;
  segment: string;
  icon: string;
  owner: WorkflowOwner;
}

/** Orden real del flujo documental con dueño por actor. */
export const WORKFLOW_FLOW: FlowStepConfig[] = [
  { stage: WorkflowStage.Intake, label: 'Carga', segment: 'intake', icon: 'pi pi-upload', owner: 'empresa' },
  { stage: WorkflowStage.Preprocessing, label: 'Preproceso', segment: 'preprocessing', icon: 'pi pi-cog', owner: 'shared' },
  { stage: WorkflowStage.AiValidation, label: 'Validación IA', segment: 'ai-validation', icon: 'pi pi-sparkles', owner: 'shared' },
  { stage: WorkflowStage.AiResult, label: 'Resultado IA', segment: 'ai-result', icon: 'pi pi-verified', owner: 'shared' },
  { stage: WorkflowStage.ManualReview, label: 'Revisión manual', segment: 'manual-review', icon: 'pi pi-user-edit', owner: 'eps' },
  { stage: WorkflowStage.Requirement, label: 'Requerimiento', segment: 'requirement', icon: 'pi pi-inbox', owner: 'empresa' },
  { stage: WorkflowStage.BusinessValidation, label: 'Negocio', segment: 'business-validation', icon: 'pi pi-briefcase', owner: 'shared' },
  { stage: WorkflowStage.InstitutionalValidation, label: 'Institucional', segment: 'institutional-validation', icon: 'pi pi-building', owner: 'shared' },
  { stage: WorkflowStage.Expediente, label: 'Expediente', segment: 'expediente', icon: 'pi pi-folder', owner: 'shared' },
  { stage: WorkflowStage.Radicacion, label: 'Radicación', segment: 'radicacion', icon: 'pi pi-send', owner: 'eps' },
  { stage: WorkflowStage.EpsResponse, label: 'Respuesta EPS/ARL', segment: 'eps-response', icon: 'pi pi-reply', owner: 'eps' },
  { stage: WorkflowStage.Timeline, label: 'Timeline', segment: 'timeline', icon: 'pi pi-history', owner: 'shared' },
];

export function workflowBasePath(actor: WorkflowActor): string {
  return actor === 'empresa' ? '/empresa' : '/eps';
}

export function workflowStepPath(step: FlowStepConfig, actor: WorkflowActor): string {
  if (step.owner === 'shared') {
    return `${workflowBasePath(actor)}/flujo/${step.segment}`;
  }
  return `${workflowBasePath(step.owner)}/${step.segment}`;
}

export function stepsForActor(actor: WorkflowActor): FlowStepConfig[] {
  return WORKFLOW_FLOW.filter((step) => step.owner === actor || step.owner === 'shared');
}

export function nextStep(current: WorkflowStage): FlowStepConfig | null {
  const index = WORKFLOW_FLOW.findIndex((step) => step.stage === current);
  if (index < 0 || index >= WORKFLOW_FLOW.length - 1) return null;
  return WORKFLOW_FLOW[index + 1];
}

export function previousStep(current: WorkflowStage): FlowStepConfig | null {
  const index = WORKFLOW_FLOW.findIndex((step) => step.stage === current);
  if (index <= 0) return null;
  return WORKFLOW_FLOW[index - 1];
}
