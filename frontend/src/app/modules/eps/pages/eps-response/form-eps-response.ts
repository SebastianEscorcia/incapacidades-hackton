import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EpsResponsePayload, EpsResponseStatus } from '@sharedWorkflow/types';

export class FormEpsResponse extends FormGroup {
  readonly glosaStatus = EpsResponseStatus.Glosa;

  constructor() {
    super({
      status: new FormControl(EpsResponseStatus.Approved, Validators.required),
      responseCode: new FormControl('', Validators.required),
      notes: new FormControl('', Validators.required),
      correctionNotes: new FormControl(''),
    });
  }

  get epsStatus(): FormControl<EpsResponseStatus> {
    return this.get('status') as FormControl<EpsResponseStatus>;
  }

  get responseCode(): FormControl<string> {
    return this.get('responseCode') as FormControl<string>;
  }

  get notes(): FormControl<string> {
    return this.get('notes') as FormControl<string>;
  }

  get correctionNotes(): FormControl<string> {
    return this.get('correctionNotes') as FormControl<string>;
  }

  getModel(): EpsResponsePayload {
    return {
      status: this.epsStatus.value,
      responseCode: this.responseCode.value,
      notes: this.notes.value,
      correctionNotes: this.correctionNotes.value || undefined,
    };
  }
}
