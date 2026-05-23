import { effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FiltroService {
  private activatedRoute = inject(ActivatedRoute);
  initialValue = signal<string>('');
  resetFiltro() {
    this.initialValue.set('');
  }

  actualizarFiltro(filtro: string) {
    this.initialValue.update(() => filtro);
  }

  currentFiltro = toSignal(
    this.activatedRoute.queryParamMap.pipe(
      map((params) => {
        const statusParam = params.get('status');
        if (!statusParam) return '';
        return statusParam;
      })
    ),
    { initialValue: this.initialValue() }
  );
}
