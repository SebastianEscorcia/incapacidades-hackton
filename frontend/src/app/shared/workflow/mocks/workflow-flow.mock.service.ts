import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { WorkflowStage, WorkflowTimelineEvent } from '../types';
import {
  FlowStepConfig,
  nextStep,
  WorkflowActor,
  workflowStepPath,
  WORKFLOW_FLOW,
} from '../workflow.constants';

export interface MockCaseSummary {
  id: string;
  company: string;
  companyId?: string;
  status: WorkflowStage;
  updatedAt: string;
  incapacidadIds?: string[];
  primaryIncapacidadId?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkflowFlowMockService {
  readonly actor = signal<WorkflowActor>('empresa');
  readonly activeCase = signal<MockCaseSummary>({
    id: 'CASO-2026-001',
    company: 'Acme Salud Ocupacional',
    companyId: 'COMP-001',
    status: WorkflowStage.Intake,
    updatedAt: new Date().toISOString(),
  });

  readonly historyEvents = signal<WorkflowTimelineEvent[]>([
    {
      id: '1',
      stage: WorkflowStage.Intake,
      title: 'Trámite iniciado',
      description: 'Lote y empresa asignada en el dashboard.',
      timestamp: new Date().toISOString(),
      actor: 'Empresa',
    },
  ]);

  addHistoryEvent(stage: WorkflowStage, title: string, description: string, actor: 'Empresa' | 'EPS' | 'Sistema' = 'Sistema'): void {
    const newEvent: WorkflowTimelineEvent = {
      id: Math.random().toString(),
      stage,
      title,
      description,
      timestamp: new Date().toISOString(),
      actor,
    };
    this.historyEvents.update((events) => [...events, newEvent]);
  }

  constructor(private readonly router: Router, private readonly messages: MessageService) {}

  setActor(actor: WorkflowActor): void {
    this.actor.set(actor);
  }

  resetFlow(companyId: string = 'COMP-001', companyName: string = 'Acme Salud Ocupacional'): void {
    this.activeCase.set({
      id: 'CASO-2026-001',
      company: companyName,
      companyId: companyId,
      status: WorkflowStage.Intake,
      updatedAt: new Date().toISOString(),
    });
    this.historyEvents.set([
      {
        id: '1',
        stage: WorkflowStage.Intake,
        title: 'Trámite iniciado',
        description: `Inicio de flujo para ${companyName}.`,
        timestamp: new Date().toISOString(),
        actor: 'Empresa',
      },
    ]);
  }

  startFlow(companyId?: string, companyName?: string): void {
    this.resetFlow(companyId, companyName);
    void this.router.navigateByUrl(workflowStepPath(WORKFLOW_FLOW[0], this.actor()));
  }

  advanceStage(stage: WorkflowStage): void {
    this.activeCase.update((current) => ({ ...current, status: stage, updatedAt: new Date().toISOString() }));
    const step = WORKFLOW_FLOW.find((s) => s.stage === stage);
    this.addHistoryEvent(
      stage,
      step ? step.label : stage,
      `Etapa completada: ${step ? step.label : stage}`,
      this.actor() === 'empresa' ? 'Empresa' : 'EPS'
    );
  }

  currentStepPath(): string {
    const step = WORKFLOW_FLOW.find((item) => item.stage === this.activeCase().status);
    return step ? workflowStepPath(step, this.actor()) : workflowStepPath(WORKFLOW_FLOW[0], this.actor());
  }

  canAccess(stage: WorkflowStage): boolean {
    const currentIndex = WORKFLOW_FLOW.findIndex((item) => item.stage === this.activeCase().status);
    const targetIndex = WORKFLOW_FLOW.findIndex((item) => item.stage === stage);
    return targetIndex >= 0 && targetIndex <= currentIndex;
  }

  ensureAccess(stage: WorkflowStage): void {
    if (!this.canAccess(stage)) {
      void this.router.navigateByUrl(this.currentStepPath());
    }
  }

  navigateNext(current: WorkflowStage): void {
    const step = nextStep(current);
    if (!step) return;
    this.advanceStage(step.stage);
    void this.router.navigateByUrl(workflowStepPath(step, this.actor()));
    // Notify user for debug / verification when using mock navigation
    try {
      this.messages.add({ severity: 'info', summary: 'Avance simulado', detail: `Paso a: ${step.label}` });
    } catch (e) {
      // MessageService may not be available in some contexts; ignore silently
      // eslint-disable-next-line no-console
      console.log('Avance simulado:', step.label);
    }
  }

  getFlow(): FlowStepConfig[] {
    return WORKFLOW_FLOW;
  }
}
