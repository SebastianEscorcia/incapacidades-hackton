import { WorkflowStage } from '../types';
import { ExpedientePayload } from '../types/payloads/expediente.payload';
import { RadicacionPayload } from '../types/payloads/radicacion.payload';
import { RequirementPayload } from '../types/payloads/requirement.payload';
import { DashboardSummary, ValidationCheck, WorkflowTimelineEvent } from '../types/workflow.types';
import { ApiRecord, apiArray, apiString } from './api.helpers';

export class WorkflowAdapter {
  static toValidationChecks(raw: ApiRecord): ValidationCheck[] {
    return apiArray(raw, 'checks').map((item, index) => ({
      id: apiString(item, 'id', `check-${index}`),
      label: apiString(item, 'label'),
      passed: item['passed'] === true,
      detail: apiString(item, 'detail') || undefined,
    }));
  }

  static requirementToPayload(model: RequirementPayload): ApiRecord {
    return { ...model };
  }

  static expedienteToPayload(model: ExpedientePayload): ApiRecord {
    return { ...model };
  }

  static radicacionToPayload(model: RadicacionPayload): ApiRecord {
    return { ...model };
  }

  static toTimeline(raw: ApiRecord): WorkflowTimelineEvent[] {
    return apiArray(raw, 'events').map((item, index) => ({
      id: apiString(item, 'id', `event-${index}`),
      stage: apiString(item, 'stage', WorkflowStage.Intake) as WorkflowStage,
      title: apiString(item, 'title'),
      description: apiString(item, 'description'),
      timestamp: apiString(item, 'timestamp'),
      actor: apiString(item, 'actor'),
    }));
  }

  static toDashboard(raw: ApiRecord): DashboardSummary {
    return {
      metrics: apiArray(raw, 'metrics').map((item) => ({
        label: apiString(item, 'label'),
        value: (item['value'] as string | number) ?? 0,
        trend: apiString(item, 'trend') || undefined,
        icon: apiString(item, 'icon', 'pi pi-chart-bar'),
      })),
      recentRequirements: apiArray(raw, 'recentRequirements').map((item) => ({
        id: apiString(item, 'id'),
        title: apiString(item, 'title'),
        status: apiString(item, 'status'),
      })),
      recentGlosas: apiArray(raw, 'recentGlosas').map((item) => ({
        id: apiString(item, 'id'),
        code: apiString(item, 'code'),
        detail: apiString(item, 'detail'),
      })),
      finalResults: apiArray(raw, 'finalResults').map((item) => ({
        id: apiString(item, 'id'),
        status: apiString(item, 'status') as DashboardSummary['finalResults'][0]['status'],
        date: apiString(item, 'date'),
      })),
    };
  }
}
