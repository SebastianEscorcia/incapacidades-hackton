import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { RequirementAction, RequirementPayload } from '@sharedWorkflow/types';

export class FormRequirement extends FormGroup {
  files: File[] = [];

  constructor() {
    super({
      action: new FormControl(RequirementAction.ReloadDoc, Validators.required),
      description: new FormControl('', [Validators.required, Validators.minLength(10)]),
      fields: new FormArray([
        new FormGroup({
          fieldKey: new FormControl(''),
          fieldValue: new FormControl(''),
        }),
      ]),
    });
  }

  get action(): FormControl<RequirementAction> {
    return this.get('action') as FormControl<RequirementAction>;
  }

  get description(): FormControl<string> {
    return this.get('description') as FormControl<string>;
  }

  get fields(): FormArray {
    return this.get('fields') as FormArray;
  }

  addField(): void {
    this.fields.push(
      new FormGroup({
        fieldKey: new FormControl(''),
        fieldValue: new FormControl(''),
      }),
    );
  }

  removeField(index: number): void {
    if (this.fields.length > 1) {
      this.fields.removeAt(index);
    } else {
      this.fields.at(0).reset();
    }
  }

  setFiles(files: File[]): void {
    this.files = [...files];
  }

  getModel(): RequirementPayload {
    const correctedFields: Record<string, string> = {};
    this.fields.controls.forEach((control) => {
      const g = control as FormGroup;
      const key = g.get('fieldKey')?.value;
      const val = g.get('fieldValue')?.value;
      if (key && val) {
        correctedFields[key] = val;
      }
    });
    return {
      action: this.action.value,
      description: this.description.value,
      correctedFields,
      fileCount: this.files.length,
    };
  }
}
