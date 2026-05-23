import { inject, Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { I18nService } from '@/core/i18n/i18n.service';

@Injectable({ providedIn: 'root' })
export class FormErroresMsg {
  private _messageService = inject(MessageService);
  private _i18n = inject(I18nService);

  getErroresForm(formulario: FormGroup) {
    const errores: string[] = [];
    this._recorrerControles(formulario, errores);
    this._agregarErroresGrupo(formulario, errores);

    this._marcarFormularioError(formulario);
    this._messageService.add({
      severity: 'warn',
      summary: this._i18n.t('validation.title'),
      detail: `${errores.join('\n')}`,
    });
  }

  showCustomError(mensaje: string) {
    this._messageService.add({
      severity: 'warn',
      summary: this._i18n.t('validation.title'),
      detail: `• ${mensaje}`,
    });
  }

  private _marcarFormularioError(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsDirty();
      control.markAsTouched();
      if ((control as FormGroup).controls) {
        this._marcarFormularioError(control as FormGroup);
      }
    });
  }

  private _agregarErroresGrupo(form: FormGroup, errores: string[], prefix: string = '') {
    if (form.errors) {
      if (form.hasError('passwordMismatch')) {
        const fieldName = prefix || this._i18n.t('validation.form');
        errores.push(this._i18n.t('validation.passwordMismatch', { field: fieldName }));
      }
      if (form.hasError('flowInterrupted')) {
        errores.push(this._i18n.t('validation.flowInterrupted'));
      }
    }

    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);

      if (control instanceof FormGroup) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        this._agregarErroresGrupo(control, errores, newPrefix);
      }
    });
  }

  private _recorrerControles(
    form: FormGroup,
    errores: string[],
    prefix: string = ''
  ): void {
    Object.keys(form.controls).forEach((nombreControl) => {
      const control = form.get(nombreControl);
      const path = prefix ? `${prefix}.${nombreControl}` : nombreControl;

      if (!control) return;

      control.markAsTouched({ onlySelf: true });
      control.markAsDirty({ onlySelf: true });
      control.updateValueAndValidity({ onlySelf: true });

      if (control instanceof FormGroup) {
        this._recorrerControles(control, errores, path);
      } else if (control.invalid) {
        const mensaje = this._getErrorMessage(control, path);
        if (mensaje) errores.push(mensaje);
      }
    });
  }

  private _getErrorMessage(control: AbstractControl, nombre: string): string {
    if (!control.errors) return '';

    if (control.hasError('required')) {
      return this._i18n.t('validation.required', { field: nombre });
    }
    if (control.hasError('email')) {
      return this._i18n.t('validation.email', { field: nombre });
    }
    if (control.hasError('pattern')) {
      return this._i18n.t('validation.pattern', { field: nombre });
    }
    if (control.hasError('minlength')) {
      return this._i18n.t('validation.minlength', {
        field: nombre,
        min: control.errors['minlength'].requiredLength,
      });
    }
    if (control.hasError('maxlength')) {
      return this._i18n.t('validation.maxlength', {
        field: nombre,
        max: control.errors['maxlength'].requiredLength,
      });
    }
    if (control.hasError('min')) {
      return this._i18n.t('validation.min', {
        field: nombre,
        min: control.errors['min'].min,
      });
    }
    if (control.hasError('max')) {
      return this._i18n.t('validation.max', {
        field: nombre,
        max: control.errors['max'].max,
      });
    }
    if (control.hasError('passwordMismatch')) {
      return this._i18n.t('validation.passwordMismatch', { field: nombre });
    }

    return this._i18n.t('validation.default', { field: nombre });
  }
}
