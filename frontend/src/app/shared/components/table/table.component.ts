import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { PaginationComponent } from '../pagination/pagination.component';

import { Router } from '@angular/router';
import { tableConst } from './const/table.const';
import { FiltroComponent } from '../filtro/filtro.component';
import { GrupoFiltros } from '@/core/types';
import { NoData } from "../no-data/no-data";
import { TruncatePipe } from '@/core/pipes/truncate.pipe';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
export interface TableAction {
  icon: string;
  tooltip: string;
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast';
  onClick: (row: any) => void;
}

interface tableData {
  datos: any[];
  url: string;
  detailUrl?: string;
  ignorar?: string[];
}
@Component({
  selector: 'app-table',
  imports: [
    CommonModule,
    PaginationComponent,
    PrimeNGModules,
    FiltroComponent,
    TruncatePipe,
    NoData
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent {
  //inputs
  isFetching = input<boolean>(false); // Nuevo input para el spinner del botón
  onRefresh = output<void>();
  showFiltros = input<boolean>(true);
  showHeaderSearch = input<boolean>(true);
  data = input.required<tableData>();
  totalPages = input<number>(1);
  rutaEdit = input<string>('');
  texto = input(tableConst);
  isLoading = input(false);
  columnTranslations = input<Record<string, string>>({});
  titleSearch = input<string>('Buscar');
  detailIncludeKeys = input<string[]>([]);
  extraActions = input<TableAction[]>([]);
  textSearch = output<string>();
  //inputs filtro
  titulo = input('Filtros');
  gruposFiltros = input<GrupoFiltros[]>([]);
  mostrarLimpiar = input(true);
  mostrarContadores = input(true);
  design: 'horizontal' | 'vertical' | 'grid' = 'horizontal';
  //variables
  router = inject(Router);
  columnas = signal<string[]>([]);
  readonly fallbackImage = '/no_img.jpg';
  detailVisible = signal<boolean>(false);
  selectedDetail = signal<any | null>(null);

  detailKeys = computed(() => {
    const detail = this.selectedDetail();
    if (!detail) return [];
    const ignored = new Set(this.data().ignorar ?? []);
    const forceIncluded = new Set((this.detailIncludeKeys() ?? []).map((key) => key.toLowerCase()));
    const technicalKeys = new Set([
      'id',
      'userName',
      'userId',
      'supplierId',
      'customerId',
      'createdAt',
      'updatedAt',
      'deletedAt',
      'password',
      'token',
      'refreshToken',
    ]);
    

    return Object.keys(detail).filter((key) => {
      if (technicalKeys.has(key)) return false;
      if (forceIncluded.has(key.toLowerCase())) return true;
      return !ignored.has(key);
    });
  });
  refresh() {
    this.onRefresh.emit();
  }

  getColumns = effect(() => {
    if (this.data().datos && this.data().datos.length > 0) {
      const columnas = Object.keys(this.data().datos[0]);
      const columnasVisibles = columnas.filter(
        (e) => !this.data().ignorar?.includes(e)
      );
      this.columnas.set(columnasVisibles);
    }
  });

  edit(row: any) {
    this.router.navigate([`${this.data().url}`], {
      queryParams: {
        id: row?.id,
      },
      state: {
        editData: row,
      },
    });
  }

  viewInvoiceDetail(row: any) {
    const detailUrl = this.data().detailUrl;
    if (!detailUrl) return;

    this.router.navigate([detailUrl], {
      queryParams: {
        id: row?.id,
      },
      state: {
        invoiceData: row,
      },
    });
  }
  getColumnLabel(column: string): string {
    return this.columnTranslations()?.[column] || column;
  }

  onTextSearch(event: Event) {
    const value = (event.target as HTMLInputElement)?.value || '';
    this.textSearch.emit(value);
  }

  getImageSrc(customer: any, field: string): string {
    if (field === 'image') {
      return customer?.[field] || this.fallbackImage;
    }

    if (field === 'images') {
      const firstImage = customer?.[field]?.[0];
      return firstImage || this.fallbackImage;
    }

    return this.fallbackImage;
  }

  onImageError(event: Event) {
    const image = event.target as HTMLImageElement;
    image.src = this.fallbackImage;
    image.onerror = null;
  }

  viewDetails(row: any) {
    this.selectedDetail.set(row);
    this.detailVisible.set(true);
  }

  closeDetails() {
    this.detailVisible.set(false);
    this.selectedDetail.set(null);
  }

  getDetailValue(value: any, key: string): string {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (typeof value === 'object') {
      if ('name' in value && value.name) return String(value.name);
      if ('fullName' in value && value.fullName) return String(value.fullName);
      if ('firstName' in value || 'lastName' in value) {
        const first = String(value.firstName ?? '');
        const last = String(value.lastName ?? '');
        return `${first} ${last}`.trim() || 'N/A';
      }
      return JSON.stringify(value);
    }

    const lowerKey = key.toLowerCase();
    const isDateKey = this.isDateField(lowerKey);
    if (isDateKey) {
      return this.formatDateInSpanishWithTime(value);
    }

    return String(value);
  }

  formatPaymentMethod(value: any): string {
    const raw = String(value ?? '').trim();
    if (!raw) return 'N/A';
    return raw.toUpperCase();
  }

  isLineItemsKey(key: string): boolean {
    const normalized = (key || '').toLowerCase();
    return normalized === 'items' || normalized === 'details' || normalized === 'products' || normalized === 'purchaseitems';
  }

  normalizeLineItems(value: any): any[] {
    if (!Array.isArray(value)) return [];
    return value;
  }

  getLineItemName(item: any): string {
    if (item?.product?.name) return String(item.product.name);
    if (item?.productName) return String(item.productName);
    if (item?.name) return String(item.name);
    if (item?.productId) return `Producto #${item.productId}`;
    return 'Producto';
  }

  getLineItemSku(item: any): string {
    if (item?.product?.sku) return String(item.product.sku);
    if (item?.sku) return String(item.sku);
    if (item?.productId) return `ID-${item.productId}`;
    return 'N/A';
  }

  getLineItemQuantity(item: any): string {
    const quantity = item?.quantity ?? 0;
    return String(quantity);
  }

  isCurrencyField(key: string): boolean {
    const normalized = (key || '').toLowerCase();
    const currencyFields = new Set([
      'total',
      'subtotal',
      'tax',
      'discount',
      'price',
      'unitprice',
      'unitcost',
      'saleprice',
      'purchaseprice',
    ]);
    return currencyFields.has(normalized);
  }

  toNumeric(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const normalized = value.replace(/[^\d.-]/g, '');
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  formatCellValue(value: any, key: string): string {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }

    if (typeof value === 'object') {
      if (value.name) return value.name;
      if (value.fullName) return value.fullName;

      if (value.firstName || value.lastName) {
        return `${value.firstName ?? ''} ${value.lastName ?? ''}`.trim();
      }

      if (value.email) return value.email;

      return 'Objeto';
    }

    const lowerKey = key.toLowerCase();
    if (this.isDateField(lowerKey)) {
      return this.formatDateTime12h(value);
    }

    return String(value);
  }


  private isDateField(lowerKey: string): boolean {
    return (
      lowerKey.includes('date') ||
      lowerKey.includes('fecha') ||
      lowerKey.includes('createdat') ||
      lowerKey.includes('updatedat') ||
      lowerKey.includes('invoicedate')
    );
  }

  private formatDateTime12h(value: any): string {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return String(value);
    }

    const day = parsedDate.getDate().toString().padStart(2, '0');
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear();

    let hours = parsedDate.getHours();
    const minutes = parsedDate.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = hours.toString().padStart(2, '0');

    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${period}`;
  }
  

  private formatDateInSpanishWithTime(value: any): string {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return String(value);
    }

    return parsedDate.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) + ' ' + parsedDate.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  filterGlobal(value?: string) { }
}
