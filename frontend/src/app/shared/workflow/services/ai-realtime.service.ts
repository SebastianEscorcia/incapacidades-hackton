import { inject, Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '@environments/environment';
import { AiRealtimeFraudeEvent } from '../types/ai.types';
import { AiResultStatus } from '../types/workflow.enums';

export type AiRealtimeEventName = 'alerta_fraude' | 'incapacidad_aprobada' | 'incapacidad_rechazada';

@Injectable({ providedIn: 'root' })
export class AiRealtimeService implements OnDestroy {
  private socket: WebSocket | null = null;
  private readonly zone = inject(NgZone);

  readonly connected = signal(false);

  readonly alertaFraude$ = new Subject<AiRealtimeFraudeEvent>();
  readonly incapacidadAprobada$ = new Subject<{ id?: string; mensaje?: string }>();
  readonly incapacidadRechazada$ = new Subject<{ id?: string; mensaje?: string }>();

  connect(): void {
    if (this.socket) return;

    const wsUrl = environment.apiUrl.replace(/^http/i, 'ws') + '/incapacidades';
    this.zone.runOutsideAngular(() => {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => this.zone.run(() => this.connected.set(true));
      this.socket.onclose = () => this.zone.run(() => this.connected.set(false));
      this.socket.onerror = () => this.zone.run(() => this.connected.set(false));
      this.socket.onmessage = (event) => this.zone.run(() => this.handleMessage(event.data));
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.alertaFraude$.complete();
    this.incapacidadAprobada$.complete();
    this.incapacidadRechazada$.complete();
  }

  private handleMessage(raw: string): void {
    try {
      const payload = JSON.parse(raw) as { event?: AiRealtimeEventName; data?: unknown; type?: AiRealtimeEventName };
      const eventName = payload.event ?? payload.type;
      if (!eventName) return;

      if (eventName === 'alerta_fraude') {
        this.alertaFraude$.next(payload.data as AiRealtimeFraudeEvent);
        return;
      }

      if (eventName === 'incapacidad_aprobada') {
        this.incapacidadAprobada$.next((payload.data ?? {}) as { id?: string; mensaje?: string });
        return;
      }

      if (eventName === 'incapacidad_rechazada') {
        this.incapacidadRechazada$.next((payload.data ?? {}) as { id?: string; mensaje?: string });
      }
    } catch {
      // Si el backend usa Socket.IO en lugar de WebSocket nativo, instalar socket.io-client.
    }
  }

  static mapEventToStatus(event: AiRealtimeEventName): AiResultStatus | null {
    if (event === 'incapacidad_aprobada') return AiResultStatus.Approved;
    if (event === 'incapacidad_rechazada') return AiResultStatus.Rejected;
    return null;
  }
}
