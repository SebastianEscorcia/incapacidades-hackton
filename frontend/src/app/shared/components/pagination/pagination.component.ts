import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { PaginationService } from './pagination.service';
import { PrimeNGModules } from '@/shared/lib/primeng.module';

@Component({
  selector: 'app-pagination',
  imports: [PrimeNGModules, CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
})
export class PaginationComponent {
  //service
  private paginationService = inject(PaginationService);
  private router = inject(Router);

  totalPages = input.required<number>();
  maxVisiblePages = input<number>(5);

  currentPage = this.paginationService.currentPage;

  pageList = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = this.maxVisiblePages();

    if (total <= 0) return [];

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => ({
        page: i + 1,
        type: 'page' as const,
      }));
    }

    const pages: Array<{ page: number; type: 'page' | 'ellipsis' }> = [];
    const halfVisible = Math.floor(maxVisible / 2);

    let start = Math.max(1, current - halfVisible);
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push({ page: 1, type: 'page' });
      if (start > 2) {
        pages.push({ page: -1, type: 'ellipsis' });
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push({ page: i, type: 'page' });
    }

    if (end < total) {
      if (end < total - 1) {
        pages.push({ page: -2, type: 'ellipsis' });
      }
      pages.push({ page: total, type: 'page' });
    }

    return pages;
  });

  hasPreviousPage = computed(() => this.currentPage() > 1);
  hasNextPage = computed(() => this.currentPage() < this.totalPages());

  paginationInfo = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    return {
      current,
      total,
      isValid: current >= 1 && current <= total && total > 0,
    };
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.router.navigate([], {
        queryParams: { page },
        queryParamsHandling: 'merge',
      });
    }
  }

  // Página anterior
  goToPreviousPage() {
    if (this.hasPreviousPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  // Página siguiente
  goToNextPage() {
    if (this.hasNextPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  // Ir a primera página
  goToFirstPage() {
    this.goToPage(1);
  }

  // Ir a última página
  goToLastPage() {
    this.goToPage(this.totalPages());
  }

  // Helpers para el template
  isActivePage(page: number): boolean {
    return page === this.currentPage();
  }

  getPageButtonFill(page: number): 'solid' | 'clear' {
    return this.isActivePage(page) ? 'solid' : 'clear';
  }

  getPageButtonColor(page: number): string {
    return this.isActivePage(page) ? 'primary' : 'medium';
  }
}
