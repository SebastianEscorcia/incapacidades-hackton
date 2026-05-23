import { inject, Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class FormErroresMsg {
  private _messageService = inject(MessageService)

  getErroresForm(formulario: FormGroup) {
    const errores: string[] = [];
    this._recorrerControles(formulario, errores);
    this._agregarErroresGrupo(formulario, errores);

    this._marcarFormularioError(formulario);
    this._messageService.add({ severity: 'warn', summary: 'Error', detail: `${errores.join('\n')}` });
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
        errores.push(`• ${prefix || 'Formulario'}: Las contraseñas no coinciden.`);
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

    if (control.hasError('required'))
      return `• ${nombre}: Este campo es obligatorio.`;
    if (control.hasError('email'))
      return `• ${nombre}: Ingrese un email válido.`;
    if (control.hasError('pattern')) return `• ${nombre}: Formato inválido.`;
    if (control.hasError('minlength'))
      return `• ${nombre}: Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    if (control.hasError('maxlength'))
      return `• ${nombre}: Debe tener como máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
    if (control.hasError('min'))
      return `• ${nombre}: El valor mínimo permitido es ${control.errors['min'].min}.`;
    if (control.hasError('max'))
      return `• ${nombre}: El valor máximo permitido es ${control.errors['max'].max}.`;
    if (control.hasError('passwordMismatch'))
      return `• ${nombre}: Las contraseñas no coinciden.`;

    return `• ${nombre}: Campo inválido.`;
  }
}
