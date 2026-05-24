import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RadicacionChannel, RadicacionPayload } from '@sharedWorkflow/types';

export class FormRadicacion extends FormGroup {
  constructor() {
    super({
      channel: new FormControl(RadicacionChannel.Portal, Validators.required),
      targetEntity: new FormControl<'eps' | 'arl'>('eps', Validators.required),
      referenceCode: new FormControl('', Validators.required),
      notes: new FormControl(''),
    });
  }

  get channel(): FormControl<RadicacionChannel> {
    return this.get('channel') as FormControl<RadicacionChannel>;
  }

  get targetEntity(): FormControl<'eps' | 'arl'> {
    return this.get('targetEntity') as FormControl<'eps' | 'arl'>;
  }

  get referenceCode(): FormControl<string> {
    return this.get('referenceCode') as FormControl<string>;
  }

  get notes(): FormControl<string> {
    return this.get('notes') as FormControl<string>;
  }

  getModel(): RadicacionPayload {
    return {
      channel: this.channel.value,
      targetEntity: this.targetEntity.value,
      referenceCode: this.referenceCode.value,
      notes: this.notes.value ?? '',
    };
  }
}
