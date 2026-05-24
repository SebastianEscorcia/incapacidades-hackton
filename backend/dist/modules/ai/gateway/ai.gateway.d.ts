import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class AiGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    emitirAlertaFraude(payload: {
        mensaje: string;
        anomalias: string[];
        timestamp: Date;
    }): void;
    emitirResultadoScraping(payload: {
        incapacidadId: string;
        medico_registro_documento: string;
        paciente_documento: string;
        eps: string;
        rethus: unknown;
        adres: unknown;
        finalizadoEn: string;
    }): void;
    emitirRespuestaEps(payload: {
        incapacidadId: string;
        estado_eps_response: 'EN_PROCESO' | 'APROBADO' | 'GLOSA' | 'RECHAZADO' | 'REQUIERE_SOPORTE';
        mensaje: string;
        requiere_requerimiento: boolean;
        finalizadoEn: string;
    }): void;
    handlePing(client: Socket, payload: any): void;
}
