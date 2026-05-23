import { inject, Injectable, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaginationService {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  currentPage = toSignal(
    this.activatedRoute.queryParamMap.pipe(
      map((params) => {
        const pageParam = params.get('page');
        if (!pageParam) return 1;

        const page = parseInt(pageParam, 10);
        return isNaN(page) || page < 1 ? 1 : page;
      })
    ),
    { initialValue: 1 }
  );

  private _itemsPerPage = signal(10);
  private _totalItems = signal(0);

  itemsPerPage = this._itemsPerPage.asReadonly();
  totalItems = this._totalItems.asReadonly();

  totalPages = computed(() => {
    const items = this._totalItems();
    const perPage = this._itemsPerPage();
    return items > 0 ? Math.ceil(items / perPage) : 0;
  });

  itemRange = computed(() => {
    const current = this.currentPage();
    const perPage = this._itemsPerPage();
    const total = this._totalItems();

    if (total === 0) {
      return { start: 0, end: 0, total: 0 };
    }

    const start = (current - 1) * perPage + 1;
    const end = Math.min(current * perPage, total);

    return { start, end, total };
  });

  canGoBack = computed(() => this.currentPage() > 1);
  canGoForward = computed(() => this.currentPage() < this.totalPages());

  setItemsPerPage(items: number) {
    if (items > 0) {
      this._itemsPerPage.set(items);
    }
  }

  setTotalItems(total: number) {
    this._totalItems.set(Math.max(0, total));
  }

  goToPage(page: number) {
    const totalPages = this.totalPages();
    if (page >= 1 && page <= totalPages && page !== this.currentPage()) {
      this.router.navigate([], {
        queryParams: { page },
        queryParamsHandling: 'merge',
      });
    }
  }

  goToFirstPage() {
    this.goToPage(1);
  }

  goToLastPage() {
    this.goToPage(this.totalPages());
  }

  goToPreviousPage() {
    if (this.canGoBack()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  goToNextPage() {
    if (this.canGoForward()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  reset() {
    this.goToPage(1);
  }

  getPaginationInfo() {
    return {
      currentPage: this.currentPage(),
      totalPages: this.totalPages(),
      itemsPerPage: this.itemsPerPage(),
      totalItems: this.totalItems(),
      itemRange: this.itemRange(),
      canGoBack: this.canGoBack(),
      canGoForward: this.canGoForward(),
    };
  }
}
