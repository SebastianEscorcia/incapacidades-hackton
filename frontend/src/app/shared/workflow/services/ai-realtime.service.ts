import { inject, Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '@environments/environment';
import { AiIncapacidadAdapter } from '../adapters/ai-incapacidad.adapter';
import { ApiRecord } from '../adapters/api.helpers';
import { AiScrapingStateService } from './ai-scraping-state.service';
import { AiRealtimeFraudeEvent, AiScrapingCompletedEvent } from '../types/ai.types';
import { AiResultStatus } from '../types/workflow.enums';

/**
 * Cliente WebSocket nativo (`ws://host/incapacidades`).
 *
 * Formato esperado del mensaje (JSON):
 * `{ "event": "validaciones_scraping_completadas", "data": { "id": "...", "scraping": { ... } } }`
 * o `{ "type": "alerta_fraude", "mensaje": "...", "anomalias": [], "timestamp": "..." }`
 */
export type AiRealtimeEventName =
  | 'alerta_fraude'
  | 'incapacidad_aprobada'
  | 'incapacidad_rechazada'
  | 'validaciones_scraping_completadas'
  | 'scraping_completado'
  | 'validacion_scraping_completada';

const SCRAPING_EVENTS: AiRealtimeEventName[] = [
  'validaciones_scraping_completadas',
  'scraping_completado',
  'validacion_scraping_completada',
];

const MAX_RECONNECT_ATTEMPTS = 8;
const RECONNECT_BASE_MS = 2000;

@Injectable({ providedIn: 'root' })
export class AiRealtimeService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private shouldReconnect = false;

  private readonly zone = inject(NgZone);
  private readonly scrapingState = inject(AiScrapingStateService);

  readonly connected = signal(false);

  readonly alertaFraude$ = new Subject<AiRealtimeFraudeEvent>();
  readonly incapacidadAprobada$ = new Subject<{ id?: string; mensaje?: string }>();
  readonly incapacidadRechazada$ = new Subject<{ id?: string; mensaje?: string }>();
  readonly scrapingCompletado$ = new Subject<AiScrapingCompletedEvent>();

  connect(): void {
    this.shouldReconnect = true;

    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.clearReconnectTimer();
    const wsUrl = this.buildWsUrl();

    this.zone.runOutsideAngular(() => {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.zone.run(() => {
          this.connected.set(true);
          this.reconnectAttempts = 0;
        });
      };

      this.socket.onclose = () => {
        this.zone.run(() => {
          this.connected.set(false);
          this.socket = null;
          this.scheduleReconnect();
        });
      };

      this.socket.onerror = () => {
        this.zone.run(() => this.connected.set(false));
      };

      this.socket.onmessage = (event) => {
        void this.readMessage(event.data).then((raw) => {
          if (raw) this.zone.run(() => this.handleMessage(raw));
        });
      };
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.reconnectAttempts = 0;
    this.socket?.close();
    this.socket = null;
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.alertaFraude$.complete();
    this.incapacidadAprobada$.complete();
    this.incapacidadRechazada$.complete();
    this.scrapingCompletado$.complete();
  }

  private buildWsUrl(): string {
    const base = environment.apiUrl.replace(/^http/i, 'ws') + '/incapacidades';
    const token = this.readAuthToken();
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  }

  private readAuthToken(): string {
    const key = (environment.TOKEN || 'TOKEN').trim();
    const candidates = [key, 'TOKEN', 'token', 'access_token'];

    for (const candidate of candidates) {
      const raw = localStorage.getItem(candidate);
      if (!raw) continue;
      const clean = raw.replace(/"/g, '').trim();
      if (clean && clean.toLowerCase() !== 'null' && clean.toLowerCase() !== 'undefined') {
        return clean;
      }
    }

    return '';
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

    this.reconnectAttempts += 1;
    const delay = RECONNECT_BASE_MS * this.reconnectAttempts;

    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async readMessage(data: unknown): Promise<string | null> {
    if (typeof data === 'string') return data;
    if (data instanceof Blob) return data.text();
    if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
    return null;
  }

  private handleMessage(raw: string): void {
    try {
      const payload = JSON.parse(raw) as {
        event?: AiRealtimeEventName;
        data?: ApiRecord;
        type?: AiRealtimeEventName;
      } & ApiRecord;

      const eventName = payload.event ?? payload.type;
      const data = (payload.data ?? payload) as ApiRecord;

      if (eventName && SCRAPING_EVENTS.includes(eventName)) {
        this.emitScrapingCompleted(data);
        return;
      }

      if (!eventName && data['scraping']) {
        this.emitScrapingCompleted(data);
        return;
      }

      if (eventName === 'alerta_fraude') {
        this.alertaFraude$.next(data as unknown as AiRealtimeFraudeEvent);
        return;
      }

      if (eventName === 'incapacidad_aprobada') {
        this.incapacidadAprobada$.next(data as { id?: string; mensaje?: string });
        return;
      }

      if (eventName === 'incapacidad_rechazada') {
        this.incapacidadRechazada$.next(data as { id?: string; mensaje?: string });
      }
    } catch {
      // Mensaje no JSON: ignorar.
    }
  }

  private emitScrapingCompleted(raw: ApiRecord): void {
    const event = AiIncapacidadAdapter.toScrapingCompletedEvent(raw);
    if (!event) return;

    this.scrapingState.applyWebSocketEvent(event);
    this.scrapingCompletado$.next(event);
  }

  static mapEventToStatus(event: AiRealtimeEventName): AiResultStatus | null {
    if (event === 'incapacidad_aprobada') return AiResultStatus.Approved;
    if (event === 'incapacidad_rechazada') return AiResultStatus.Rejected;
    return null;
  }
}
