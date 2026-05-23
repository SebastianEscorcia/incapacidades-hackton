import { Component, effect, input, output, signal } from '@angular/core';
import { Table, TablePageEvent } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { PrimeNGModules } from '@/shared/lib/primeng.module';

interface TableData {
  datos: any[];
  url?: string;
  ignorar?: string[];
}

interface TableConfig {
  imageColumns?: string[]; // Columnas que contienen imágenes
  dateColumns?: string[]; // Columnas de fecha
  booleanColumns?: string[]; // Columnas booleanas
  statusColumns?: string[]; // Columnas de estado
  customColumnWidths?: { [key: string]: string }; // Anchos personalizados
}

@Component({
  selector: 'app-table-complete',
  imports: [PrimeNGModules, CommonModule],
  templateUrl: './table-complete.html',
  styleUrl: './table-complete.scss',
})
export class TableComplete {
  // Inputs
  public data = input.required<TableData>();
  public globalFilterFields = input<string[]>([]);
  public loading = input<boolean>(false);
  public rowsPerPage = input<number>(10);
  public totalRecords = input<number>(0);
  public config = input<TableConfig>({});

  // Configuración de acciones
  public showActions = input<boolean>(true);
  public showViewAction = input<boolean>(true);
  public showEditAction = input<boolean>(true);
  public showDeleteAction = input<boolean>(true);

  // Outputs para eventos
  public pageChange = output<TablePageEvent>();
  public viewAction = output<any>();
  public editAction = output<any>();
  public deleteAction = output<any>();
  public searchAction = output<string>();

  // Signals
  public visibleColumns = signal<string[]>([]);

  constructor() {
    effect(() => {
      this.updateColumns();
    });
  }

  ngOnInit() {
    this.updateColumns();
  }

  /**
   * Actualiza las columnas visibles excluyendo 'id' y las columnas en 'ignorar'
   */
  private updateColumns() {
    if (this.data().datos && this.data().datos.length > 0) {
      const allColumns = Object.keys(this.data().datos[0]);
      const ignoredColumns = ['id', ...(this.data().ignorar || [])];

      const visible = allColumns.filter(
        (column) => !ignoredColumns.includes(column)
      );

      this.visibleColumns.set(visible);
    }
  }

  /**
   * Maneja el cambio de página
   */
  onPageChange(event: TablePageEvent) {
    this.pageChange.emit(event);
  }

  /**
   * Maneja el filtro global
   */
  onGlobalFilter(event: any, table: Table) {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
    this.searchAction.emit(value);
  }

  /**
   * Obtiene valores anidados de objetos (ej: user.name)
   */
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  /**
   * Verifica si una columna contiene imágenes
   */
  isImageColumn(column: string): boolean {
    const imageColumns = this.config()?.imageColumns || [];
    return imageColumns.includes(column) ||
      column.toLowerCase().includes('image') ||
      column.toLowerCase().includes('img') ||
      column.toLowerCase().includes('photo') ||
      column.toLowerCase().includes('avatar');
  }

  /**
   * Verifica si una columna es de fecha
   */
  isDateColumn(column: string): boolean {
    const dateColumns = this.config()?.dateColumns || [];
    return dateColumns.includes(column) ||
      column.toLowerCase().includes('date') ||
      column.toLowerCase().includes('created') ||
      column.toLowerCase().includes('updated');
  }

  /**
   * Verifica si una columna es booleana
   */
  isBooleanColumn(column: string): boolean {
    const booleanColumns = this.config()?.booleanColumns || [];
    return booleanColumns.includes(column) ||
      column.toLowerCase().includes('verified') ||
      column.toLowerCase().includes('active') ||
      column.toLowerCase().includes('enabled');
  }

  /**
   * Verifica si una columna es de estado
   */
  isStatusColumn(column: string): boolean {
    const statusColumns = this.config()?.statusColumns || [];
    return statusColumns.includes(column) ||
      column.toLowerCase().includes('status') ||
      column.toLowerCase().includes('state');
  }

  /**
   * Formatea el encabezado de la columna
   */
  formatColumnHeader(column: string): string {
    // Convierte camelCase o snake_case a Title Case
    return column
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Formatea fechas
   */
  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Obtiene el ancho de la columna
   */
  getColumnWidth(column: string): string {
    const customWidths = this.config()?.customColumnWidths || {};
    if (customWidths[column]) {
      return customWidths[column];
    }

    // Anchos por defecto según tipo de columna
    if (this.isImageColumn(column)) return '100px';
    if (this.isBooleanColumn(column)) return '80px';
    if (this.isStatusColumn(column)) return '120px';

    return 'auto';
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: any) {
    event.target.src = 'assets/images/placeholder.png'; // Imagen por defecto
  }

  /**
   * Obtiene la severidad del tag según el estado
   */
  getSeverity(status: string): any {
    if (!status) return 'info';

    const statusLower = status.toLowerCase();

    const severityMap: { [key: string]: string } = {
      'active': 'success',
      'activo': 'success',
      'success': 'success',
      'completed': 'success',
      'approved': 'success',

      'inactive': 'danger',
      'inactivo': 'danger',
      'error': 'danger',
      'rejected': 'danger',
      'cancelled': 'danger',

      'pending': 'warn',
      'pendiente': 'warn',
      'warning': 'warn',
      'in-progress': 'warn',

      'new': 'info',
      'nuevo': 'info',
      'info': 'info',
    };

    return severityMap[statusLower] || 'info';
  }

  /**
   * Acciones de la tabla
   */
  onView(item: any) {
    this.viewAction.emit(item);
  }

  onEdit(item: any) {
    this.editAction.emit(item);
  }

  onDelete(item: any) {
    this.deleteAction.emit(item);
  }

  clear(table: Table) {
    table.clear();
  }
}