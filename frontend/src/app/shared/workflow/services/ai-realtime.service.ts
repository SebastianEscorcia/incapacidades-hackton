import { inject, Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '@environments/environment';
import { AiIncapacidadAdapter } from '../adapters/ai-incapacidad.adapter';
import { ApiRecord, apiString } from '../adapters/api.helpers';
import { AiScrapingStateService } from './ai-scraping-state.service';
import { AiRealtimeFraudeEvent, AiScrapingCompletedEvent, EpsResponseCompletedEvent } from '../types/ai.types';
import { AiResultStatus } from '../types/workflow.enums';

/**
 * Cliente Socket.IO (`http://host/incapacidades`).
 */
export type AiRealtimeEventName =
  | 'alerta_fraude'
  | 'validacion_documental_completada'
  | 'eps_response_completada'
  | 'pong_auditor';

const SCRAPING_EVENTS: AiRealtimeEventName[] = [
  'validacion_documental_completada',
];

const MAX_RECONNECT_ATTEMPTS = 8;
const RECONNECT_BASE_MS = 2000;

@Injectable({ providedIn: 'root' })
export class AiRealtimeService implements OnDestroy {
  private socket: Socket | null = null;
  private shouldReconnect = false;

  private readonly zone = inject(NgZone);
  private readonly scrapingState = inject(AiScrapingStateService);

  readonly connected = signal(false);

  readonly alertaFraude$ = new Subject<AiRealtimeFraudeEvent>();
  readonly incapacidadAprobada$ = new Subject<{ id?: string; mensaje?: string }>();
  readonly incapacidadRechazada$ = new Subject<{ id?: string; mensaje?: string }>();
  readonly scrapingCompletado$ = new Subject<AiScrapingCompletedEvent>();
  readonly epsResponseCompletada$ = new Subject<EpsResponseCompletedEvent>();
  readonly pongAuditor$ = new Subject<{ mensaje: string }>();

  connect(): void {
    this.shouldReconnect = true;
    if (this.socket?.connected || this.socket?.active) {
      return;
    }

    const token = this.readAuthToken();

    this.zone.runOutsideAngular(() => {
      this.socket = io(`${environment.apiUrl}/incapacidades`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_BASE_MS,
        auth: token ? { token } : undefined,
        query: token ? { token } : undefined,
      });

      this.socket.on('connect', () => {
        this.zone.run(() => {
          this.connected.set(true);
        });
      });

      this.socket.on('disconnect', () => {
        this.zone.run(() => {
          this.connected.set(false);
        });
      });

      this.socket.on('connect_error', () => {
        this.zone.run(() => this.connected.set(false));
      });

      this.socket.on('alerta_fraude', (data: ApiRecord) => {
        this.zone.run(() => this.handleSocketEvent('alerta_fraude', data));
      });
      this.socket.on('validacion_documental_completada', (data: ApiRecord) => {
        this.zone.run(() => this.handleSocketEvent('validacion_documental_completada', data));
      });
      this.socket.on('eps_response_completada', (data: ApiRecord) => {
        this.zone.run(() => this.handleSocketEvent('eps_response_completada', data));
      });
      this.socket.on('pong_auditor', (data: ApiRecord) => {
        this.zone.run(() => this.handleSocketEvent('pong_auditor', data));
      });
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.alertaFraude$.complete();
    this.incapacidadAprobada$.complete();
    this.incapacidadRechazada$.complete();
    this.scrapingCompletado$.complete();
    this.epsResponseCompletada$.complete();
    this.pongAuditor$.complete();
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

  private handleSocketEvent(eventName: AiRealtimeEventName, data: ApiRecord): void {
    if (SCRAPING_EVENTS.includes(eventName)) {
      this.emitScrapingCompleted(data);
      return;
    }

    if (eventName === 'alerta_fraude') {
      this.alertaFraude$.next(data as unknown as AiRealtimeFraudeEvent);
      return;
    }

    if (eventName === 'eps_response_completada') {
      const event = AiIncapacidadAdapter.toEpsResponseCompletedEvent(data);
      if (event) this.epsResponseCompletada$.next(event);
      return;
    }

    if (eventName === 'pong_auditor') {
      this.pongAuditor$.next({
        mensaje: apiString(data, 'mensaje', 'Conexión activa con el sistema de IA'),
      });
    }
  }

  private emitScrapingCompleted(raw: ApiRecord): void {
    const event = AiIncapacidadAdapter.toScrapingCompletedEvent(raw);
    if (!event) return;

    this.scrapingState.applyWebSocketEvent(event);
    this.scrapingCompletado$.next(event);
  }

  static mapEventToStatus(event: AiRealtimeEventName): AiResultStatus | null {
    return null;
  }
}
