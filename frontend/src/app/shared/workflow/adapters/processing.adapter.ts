import { AiResultStatus, IntakeValidationStatus } from '../types';
import { ManualReviewPayload } from '../types/payloads/manual-review.payload';
import { AiResultSummary, AiValidationMetric, PreprocessingTask, PreprocessingTaskState } from '../types/workflow.types';
import { ApiRecord, apiArray, apiBoolean, apiNumber, apiString } from './api.helpers';

export class ProcessingAdapter {
  static toPreprocessingTasks(raw: ApiRecord): PreprocessingTask[] {
    return apiArray(raw, 'tasks').map((item, index) => ({
      id: apiString(item, 'id', `task-${index}`),
      label: apiString(item, 'label'),
      state: this.toTaskState(item),
      detail: apiString(item, 'detail') || undefined,
    }));
  }

  private static toTaskState(item: ApiRecord): PreprocessingTaskState {
    const state = apiString(item, 'state').toLowerCase();
    if (state === 'completed' || state === 'failed' || state === 'pending') {
      return state as PreprocessingTaskState;
    }
    return apiBoolean(item, 'completed') ? 'completed' : 'pending';
  }

  static toAiMetrics(raw: ApiRecord): AiValidationMetric[] {
    return apiArray(raw, 'metrics').map((item, index) => ({
      id: apiString(item, 'id', `metric-${index}`),
      label: apiString(item, 'label'),
      score: apiNumber(item, 'score'),
      status: apiString(item, 'status', IntakeValidationStatus.Pending) as IntakeValidationStatus,
      detail: apiString(item, 'detail') || undefined,
    }));
  }

  static toAiResult(raw: ApiRecord): AiResultSummary {
    return {
      status: apiString(raw, 'status', AiResultStatus.ManualReview) as AiResultStatus,
      confidence: apiNumber(raw, 'confidence'),
      findings: apiArray(raw, 'findings').map((f) => apiString(f, 'message', apiString(f, 'text'))),
    };
  }

  static manualReviewToPayload(model: ManualReviewPayload): ApiRecord {
    return { ...model };
  }
}
