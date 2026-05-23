import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule, ButtonSeverity } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { FiltroService } from './filtro.service';
interface FiltroBoton {
  key: string;
  label: string;
  value: string;
  icon?: string;
  count?: number;
  color?:
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'help'
  | 'danger';
}

interface GrupoFiltros {
  titulo: string;
  parametro: string;
  botones: FiltroBoton[];
  multiple?: boolean;
  mostrarTodos?: boolean;
}

@Component({
  selector: 'app-filtro',
  imports: [
    CommonModule,
    ButtonModule,
    InputText,
    IconFieldModule,
    InputIconModule,
    FormsModule,
  ],
  templateUrl: './filtro.component.html',
  styleUrl: './filtro.component.css',
})
export class FiltroComponent {
  titulo = input('Filtros');
  gruposFiltros = input<GrupoFiltros[]>([]);
  mostrarLimpiar = input(true);
  mostrarContadores = input(true);
  design: 'horizontal' | 'vertical' | 'grid' = 'horizontal';
  busqueda: string = '';
  @Output() onFiltroChange = new EventEmitter<{
    parametro: string;
    valores: string[];
  }>();
  @Output() onLimpiarFiltros = new EventEmitter<void>();
  @Output() onTextSearch = new EventEmitter<string>();

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private filtroService = inject(FiltroService);
  // Signals para manejo de estado
  filtrosActivos = signal<Record<string, string[]>>({});
  totalFiltrosActivos = computed(() => {
    const filtros = this.filtrosActivos();
    return Object.values(filtros).reduce(
      (total, valores) => total + valores.length,
      0
    );
  });
  buscar() {
    this.onTextSearch.emit((this.busqueda || '').trim());
  }
  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement)?.value || '';
    this.busqueda = value;
    this.onTextSearch.emit(value.trim());
  }
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const filtrosIniciales: Record<string, string[]> = {};

      this.gruposFiltros().forEach((grupo) => {
        const valor = params[grupo.parametro];
        if (valor) {
          filtrosIniciales[grupo.parametro] = Array.isArray(valor)
            ? valor
            : [valor];
        } else {
          filtrosIniciales[grupo.parametro] = [];
        }
      });

      this.filtrosActivos.set(filtrosIniciales);
    });
  }

  toggleFiltro(grupo: GrupoFiltros, boton: FiltroBoton) {
    const filtrosActuales = { ...this.filtrosActivos() };
    const valoresActuales = filtrosActuales[grupo.parametro] || [];

    if (grupo.multiple) {
      const index = valoresActuales.indexOf(boton.value);
      if (index > -1) {
        valoresActuales.splice(index, 1);
      } else {
        valoresActuales.push(boton.value);
      }
    } else {
      if (valoresActuales.includes(boton.value)) {
        filtrosActuales[grupo.parametro] = [];
      } else {
        filtrosActuales[grupo.parametro] = [boton.value];
      }
    }

    this.filtrosActivos.set(filtrosActuales);
    this.actualizarQueryParams();
    this.onFiltroChange.emit({
      parametro: grupo.parametro,
      valores: filtrosActuales[grupo.parametro],
    });
  }

  seleccionarTodos(grupo: GrupoFiltros) {
    const filtrosActuales = { ...this.filtrosActivos() };
    filtrosActuales[grupo.parametro] = [];

    this.filtrosActivos.set(filtrosActuales);
    this.actualizarQueryParams();
    this.onFiltroChange.emit({
      parametro: grupo.parametro,
      valores: [],
    });
  }

  limpiarTodosFiltros() {
    const filtrosLimpios: Record<string, string[]> = {};
    this.gruposFiltros().forEach((grupo) => {
      filtrosLimpios[grupo.parametro] = [];
    });

    this.filtrosActivos.set(filtrosLimpios);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'replace',
    });

    this.busqueda = '';
    this.onTextSearch.emit('');
    this.onLimpiarFiltros.emit();
  }

  private actualizarQueryParams() {
    const queryParams: Record<string, string | string[]> = {};
    const filtros = this.filtrosActivos();

    Object.entries(filtros).forEach(([parametro, valores]) => {
      if (valores.length > 0) {
        queryParams[parametro] = valores.length === 1 ? valores[0] : valores;
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace',
    });
  }

  estaActivo(grupo: GrupoFiltros, boton: FiltroBoton): boolean {
    const valores = this.filtrosActivos()[grupo.parametro] || [];
    return valores.includes(boton.value);
  }

  obtenerSeverityBoton(
    grupo: GrupoFiltros,
    boton: FiltroBoton
  ): ButtonSeverity {
    if (this.estaActivo(grupo, boton)) {
      return (boton.color as ButtonSeverity) || 'primary';
    }
    return 'secondary';
  }

  obtenerConteoTotal(grupo: GrupoFiltros): number {
    return grupo.botones.reduce(
      (total, boton) => total + (boton.count || 0),
      0
    );
  }
}
