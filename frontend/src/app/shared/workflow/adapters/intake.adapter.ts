import { DocumentFileType, IntakeValidationStatus } from '../types';
import { IntakeUploadPayload } from '../types/payloads/intake.payload';
import { IntakeFileResponse } from '../types/responses/intake.response';
import { ApiRecord, apiArray, apiNumber, apiString } from './api.helpers';

export class IntakeAdapter {
  static toDomainList(raw: ApiRecord): IntakeFileResponse[] {
    return apiArray(raw, 'files').map((item, index) => ({
      id: apiString(item, 'id', `file-${index}`),
      name: apiString(item, 'name', apiString(item, 'fileName')),
      type: apiString(item, 'type', DocumentFileType.Pdf) as DocumentFileType,
      sizeBytes: apiNumber(item, 'sizeBytes', apiNumber(item, 'size')),
      validationStatus: apiString(
        item,
        'validationStatus',
        IntakeValidationStatus.Pending,
      ) as IntakeValidationStatus,
      validationMessage: apiString(item, 'validationMessage') || undefined,
    }));
  }

  static toPayload(model: IntakeUploadPayload, files: File[]): FormData {
    const formData = new FormData();
    formData.append('companyId', model.companyId);
    formData.append('batchName', model.batchName);
    formData.append('notes', model.notes);
    files.forEach((file, index) => formData.append(`files[${index}]`, file));
    if (model.metadata) {
      formData.append('metadata', JSON.stringify(model.metadata));
    }
    return formData;
  }

  static toJsonPayload(model: IntakeUploadPayload): ApiRecord {
    return {
      companyId: model.companyId,
      batchName: model.batchName,
      notes: model.notes,
      metadata: model.metadata ?? {},
      fileCount: model.fileCount,
    };
  }
}
