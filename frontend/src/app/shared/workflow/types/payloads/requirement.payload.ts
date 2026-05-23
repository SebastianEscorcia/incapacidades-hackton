import { RequirementAction } from '../workflow.enums';

export interface RequirementPayload {
  action: RequirementAction;
  description: string;
  correctedFields: Record<string, string>;
  fileCount: number;
}
