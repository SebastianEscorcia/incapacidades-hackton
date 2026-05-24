import { Injectable } from '@angular/core';
import { WorkflowStage, WorkflowTimelineEvent } from '@sharedWorkflow/types';

export interface CompanyFlowSession {
  id: string;
  companyId: string;
  companyName: string;
  startedAt: string;
  updatedAt: string;
  lastStage: WorkflowStage;
  primaryIncapacidadId?: string;
  events: WorkflowTimelineEvent[];
}

const STORAGE_KEY = 'empresa-flow-audits';

@Injectable({ providedIn: 'root' })
export class EmpresaFlowAuditService {
  listSessions(companyId?: string): CompanyFlowSession[] {
    const sessions = this.readAll();
    if (!companyId) return sessions;
    return sessions.filter((session) => session.companyId === companyId);
  }

  getSession(sessionId: string): CompanyFlowSession | undefined {
    return this.readAll().find((session) => session.id === sessionId);
  }

  createSession(companyId: string, companyName: string): CompanyFlowSession {
    const session: CompanyFlowSession = {
      id: crypto.randomUUID(),
      companyId,
      companyName,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStage: WorkflowStage.Intake,
      events: [],
    };
    this.writeAll([session, ...this.readAll()]);
    return session;
  }

  upsertSession(session: CompanyFlowSession): void {
    const sessions = this.readAll();
    const index = sessions.findIndex((item) => item.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    this.writeAll(sessions);
  }

  appendEvent(sessionId: string, event: WorkflowTimelineEvent, patch?: Partial<CompanyFlowSession>): void {
    const sessions = this.readAll();
    const index = sessions.findIndex((item) => item.id === sessionId);
    if (index < 0) return;

    sessions[index] = {
      ...sessions[index],
      ...patch,
      updatedAt: new Date().toISOString(),
      events: [...sessions[index].events, event],
    };
    this.writeAll(sessions);
  }

  private readAll(): CompanyFlowSession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CompanyFlowSession[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll(sessions: CompanyFlowSession[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}
