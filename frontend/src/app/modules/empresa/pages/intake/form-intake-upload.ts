import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IntakeUploadPayload } from '@sharedWorkflow/types';

export class FormIntakeUpload extends FormGroup {
  files: File[] = [];

  constructor() {
    super({
      companyId: new FormControl('', Validators.required),
      batchName: new FormControl('', Validators.required),
      notes: new FormControl(''),
    });
  }

  get companyId(): FormControl<string> {
    return this.get('companyId') as FormControl<string>;
  }

  get batchName(): FormControl<string> {
    return this.get('batchName') as FormControl<string>;
  }

  get notes(): FormControl<string> {
    return this.get('notes') as FormControl<string>;
  }

  setFiles(files: File[]): void {
    this.files = [...files];
  }

  hasFiles(): boolean {
    return this.files.length > 0;
  }

  getModel(): IntakeUploadPayload {
    return {
      companyId: this.companyId.value,
      batchName: this.batchName.value,
      notes: this.notes.value ?? '',
      fileCount: this.files.length,
    };
  }
}
