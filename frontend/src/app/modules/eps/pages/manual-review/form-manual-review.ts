import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ManualReviewPayload } from '@sharedWorkflow/types';

export class FormManualReview extends FormGroup {
  constructor() {
    super({
      validateAnomalies: new FormControl(false),
      reviewFraud: new FormControl(false),
      reviewCoherence: new FormControl(false),
      reviewQuality: new FormControl(false),
      requiresCompanyAction: new FormControl(false, Validators.required),
      decisionNotes: new FormControl('', [Validators.required, Validators.minLength(10)]),
    });
  }

  get validateAnomalies(): FormControl<boolean> {
    return this.get('validateAnomalies') as FormControl<boolean>;
  }

  get reviewFraud(): FormControl<boolean> {
    return this.get('reviewFraud') as FormControl<boolean>;
  }

  get reviewCoherence(): FormControl<boolean> {
    return this.get('reviewCoherence') as FormControl<boolean>;
  }

  get reviewQuality(): FormControl<boolean> {
    return this.get('reviewQuality') as FormControl<boolean>;
  }

  get requiresCompanyAction(): FormControl<boolean> {
    return this.get('requiresCompanyAction') as FormControl<boolean>;
  }

  get decisionNotes(): FormControl<string> {
    return this.get('decisionNotes') as FormControl<string>;
  }

  getModel(): ManualReviewPayload {
    return {
      validateAnomalies: this.validateAnomalies.value ?? false,
      reviewFraud: this.reviewFraud.value ?? false,
      reviewCoherence: this.reviewCoherence.value ?? false,
      reviewQuality: this.reviewQuality.value ?? false,
      requiresCompanyAction: this.requiresCompanyAction.value ?? false,
      decisionNotes: this.decisionNotes.value,
    };
  }
}
