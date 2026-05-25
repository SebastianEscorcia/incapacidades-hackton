import { Injectable, computed, signal } from '@angular/core';

export type AiNotificationSeverity = 'success' | 'info' | 'warn' | 'danger';

export interface AiNotificationItem {
  id: string;
  title: string;
  message: string;
  severity: AiNotificationSeverity;
  timestamp: string;
  incapacidadId?: string;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiNotificationCenterService {
  private readonly itemsSignal = signal<AiNotificationItem[]>([]);

  readonly items = this.itemsSignal.asReadonly();
  readonly unreadCount = computed(() => this.itemsSignal().filter((item) => !item.read).length);

  push(notification: Omit<AiNotificationItem, 'id' | 'timestamp' | 'read'>): AiNotificationItem {
    const item: AiNotificationItem = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.itemsSignal.update((current) => [item, ...current].slice(0, 50));
    return item;
  }

  markAllAsRead(): void {
    this.itemsSignal.update((current) => current.map((item) => ({ ...item, read: true })));
  }

  clear(): void {
    this.itemsSignal.set([]);
  }
}
