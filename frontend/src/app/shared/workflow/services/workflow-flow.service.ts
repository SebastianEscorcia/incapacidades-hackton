import { Injectable, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { WorkflowStage, WorkflowTimelineEvent } from '../types';
import { ScrapingResults } from '../types/ai.types';
import {
  FlowStepConfig,
  nextStep,
  previousStep,
  WorkflowActor,
  workflowBasePath,
  workflowStepPath,
  WORKFLOW_FLOW,
} from '../workflow.constants';
import { EmpresaFlowAuditService, CompanyFlowSession } from '../../../modules/empresa/services/empresa-flow-audit.service';

export interface ActiveCaseSummary {
  id: string;
  company: string;
  companyId?: string;
  status: WorkflowStage;
  updatedAt: string;
  incapacidadIds?: string[];
  primaryIncapacidadId?: string;
  scraping?: ScrapingResults;
  scrapingPending?: boolean;
  auditSessionId?: string;
}

const ACTIVE_CASE_STORAGE_KEY = 'empresa-active-case';

@Injectable({ providedIn: 'root' })
export class WorkflowFlowService {
  readonly actor = signal<WorkflowActor>('empresa');
  readonly activeCase = signal<ActiveCaseSummary>(this.restoreActiveCase());

  readonly historyEvents = signal<WorkflowTimelineEvent[]>([]);

  constructor(
    private readonly router: Router,
    private readonly audit: EmpresaFlowAuditService,
  ) {
    effect(() => {
      this.activeCase();
      this.persistActiveCase();
    });
  }

  setActor(actor: WorkflowActor): void {
    this.actor.set(actor);
  }

  setSelectedCompany(companyId: string, companyName: string): void {
    this.activeCase.update((current) => ({
      ...current,
      companyId,
      company: companyName,
      updatedAt: new Date().toISOString(),
    }));
  }

  resetFlow(companyId: string, companyName: string): void {
    let auditSessionId: string | undefined;
    const startedEvent: WorkflowTimelineEvent = {
      id: crypto.randomUUID(),
      stage: WorkflowStage.Intake,
      title: 'Trámite iniciado',
      description: `Inicio de flujo para ${companyName}.`,
      timestamp: new Date().toISOString(),
      actor: 'Empresa',
    };

    if (this.actor() === 'empresa') {
      const session = this.audit.createSession(companyId, companyName);
      auditSessionId = session.id;
      this.audit.appendEvent(session.id, startedEvent, { lastStage: WorkflowStage.Intake });
    }

    this.activeCase.set({
      id: '',
      company: companyName,
      companyId,
      status: WorkflowStage.Intake,
      updatedAt: new Date().toISOString(),
      incapacidadIds: undefined,
      primaryIncapacidadId: undefined,
      scraping: undefined,
      scrapingPending: undefined,
      auditSessionId,
    });
    this.historyEvents.set([startedEvent]);
  }

  startFlow(companyId?: string, companyName?: string): void {
    if (companyId && companyName) {
      this.resetFlow(companyId, companyName);
    }
    void this.router.navigateByUrl(workflowStepPath(WORKFLOW_FLOW[0], this.actor()));
  }

  advanceStage(stage: WorkflowStage): void {
    this.activeCase.update((current) => ({ ...current, status: stage, updatedAt: new Date().toISOString() }));
    const step = WORKFLOW_FLOW.find((s) => s.stage === stage);
    this.addHistoryEvent(
      stage,
      step ? step.label : stage,
      `Etapa completada: ${step ? step.label : stage}`,
      this.actor() === 'empresa' ? 'Empresa' : 'EPS',
    );
  }

  currentStepPath(): string {
    const step = WORKFLOW_FLOW.find((item) => item.stage === this.activeCase().status);
    return step ? workflowStepPath(step, this.actor()) : workflowStepPath(WORKFLOW_FLOW[0], this.actor());
  }

  canAccess(stage: WorkflowStage): boolean {
    const primaryId = this.activeCase().primaryIncapacidadId;
    if (!primaryId && stage !== WorkflowStage.Intake) {
      return false;
    }

    const currentIndex = WORKFLOW_FLOW.findIndex((item) => item.stage === this.activeCase().status);
    const targetIndex = WORKFLOW_FLOW.findIndex((item) => item.stage === stage);

    if (this.isFlowLocked()) {
      return targetIndex === currentIndex;
    }

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
  }

  navigateBack(current: WorkflowStage): void {
    if (this.isFlowLocked()) return;
    const step = previousStep(current);
    if (!step) return;
    void this.router.navigateByUrl(workflowStepPath(step, this.actor()));
  }

  goToStart(): void {
    void this.router.navigateByUrl(workflowBasePath(this.actor()));
  }

  getFlow(): FlowStepConfig[] {
    return WORKFLOW_FLOW;
  }

  isFinalStage(stage: WorkflowStage): boolean {
    const last = WORKFLOW_FLOW[WORKFLOW_FLOW.length - 1];
    return Boolean(last && last.stage === stage);
  }

  isFlowLocked(): boolean {
    return this.isFinalStage(this.activeCase().status);
  }

  addHistoryEvent(
    stage: WorkflowStage,
    title: string,
    description: string,
    actor: 'Empresa' | 'EPS' | 'Sistema' = 'Sistema',
  ): void {
    const event: WorkflowTimelineEvent = {
      id: crypto.randomUUID(),
      stage,
      title,
      description,
      timestamp: new Date().toISOString(),
      actor,
    };

    this.historyEvents.update((events) => [...events, event]);

    const sessionId = this.activeCase().auditSessionId;
    if (!sessionId || this.actor() !== 'empresa') return;

    this.audit.appendEvent(sessionId, event, {
      lastStage: stage,
      primaryIncapacidadId: this.activeCase().primaryIncapacidadId,
    } satisfies Partial<CompanyFlowSession>);
  }

  private persistActiveCase(): void {
    if (this.actor() !== 'empresa') return;
    try {
      localStorage.setItem(ACTIVE_CASE_STORAGE_KEY, JSON.stringify(this.activeCase()));
    } catch {
      // ignore storage errors
    }
  }

  private restoreActiveCase(): ActiveCaseSummary {
    const fallback: ActiveCaseSummary = {
      id: '',
      company: '',
      status: WorkflowStage.Intake,
      updatedAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(ACTIVE_CASE_STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as ActiveCaseSummary;
      if (!parsed?.companyId || !parsed.company) return fallback;
      return { ...fallback, ...parsed };
    } catch {
      return fallback;
    }
  }
}
