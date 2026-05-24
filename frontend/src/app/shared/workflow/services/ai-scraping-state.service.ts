import { Injectable, signal } from '@angular/core';
import { AiScrapingCompletedEvent, ScrapingResults } from '../types/ai.types';
import { AiIncapacidadAdapter } from '../adapters/ai-incapacidad.adapter';

@Injectable({ providedIn: 'root' })
export class AiScrapingStateService {
  private readonly byIncapacidadId = signal<Record<string, ScrapingResults>>({});
  private readonly pendingIds = signal<Set<string>>(new Set());

  readonly snapshot = this.byIncapacidadId.asReadonly();

  get(incapacidadId: string): ScrapingResults | undefined {
    return this.byIncapacidadId()[incapacidadId];
  }

  isPending(incapacidadId: string): boolean {
    return this.pendingIds().has(incapacidadId);
  }

  setFromUpload(incapacidadId: string, scraping?: ScrapingResults): void {
    if (!scraping) {
      this.markPending(incapacidadId);
      return;
    }

    this.patch(incapacidadId, scraping);
    if (AiIncapacidadAdapter.isScrapingComplete(scraping)) {
      this.clearPending(incapacidadId);
    } else {
      this.markPending(incapacidadId);
    }
  }

  applyWebSocketEvent(event: AiScrapingCompletedEvent): void {
    const id = event.incapacidadId ?? event.id;
    if (!id) return;

    const merged = AiIncapacidadAdapter.mergeScraping(this.get(id), {
      ...event.scraping,
      completed: true,
    });
    this.patch(id, merged);
    this.clearPending(id);
  }

  private patch(incapacidadId: string, scraping: ScrapingResults): void {
    this.byIncapacidadId.update((current) => ({
      ...current,
      [incapacidadId]: AiIncapacidadAdapter.mergeScraping(current[incapacidadId], scraping),
    }));
  }

  private markPending(incapacidadId: string): void {
    this.pendingIds.update((current) => new Set(current).add(incapacidadId));
  }

  private clearPending(incapacidadId: string): void {
    this.pendingIds.update((current) => {
      const next = new Set(current);
      next.delete(incapacidadId);
      return next;
    });
  }
}
