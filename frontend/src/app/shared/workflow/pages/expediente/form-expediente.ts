import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ExpedientePayload } from '@sharedWorkflow/types';

export class FormExpediente extends FormGroup {
  constructor() {
    super({
      documentIds: new FormControl('', Validators.required),
      metadataKey: new FormControl(''),
      metadataValue: new FormControl(''),
      includeAnnexes: new FormControl(true),
      auditNotes: new FormControl(''),
    });
  }

  get documentIds(): FormControl<string> {
    return this.get('documentIds') as FormControl<string>;
  }

  get metadataKey(): FormControl<string> {
    return this.get('metadataKey') as FormControl<string>;
  }

  get metadataValue(): FormControl<string> {
    return this.get('metadataValue') as FormControl<string>;
  }

  get includeAnnexes(): FormControl<boolean> {
    return this.get('includeAnnexes') as FormControl<boolean>;
  }

  get auditNotes(): FormControl<string> {
    return this.get('auditNotes') as FormControl<string>;
  }

  getModel(): ExpedientePayload {
    const metadata: Record<string, string> = {};
    if (this.metadataKey.value && this.metadataValue.value) {
      metadata[this.metadataKey.value] = this.metadataValue.value;
    }
    return {
      documentIds: this.documentIds.value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
      metadata,
      includeAnnexes: this.includeAnnexes.value ?? true,
      auditNotes: this.auditNotes.value ?? '',
    };
  }
}
