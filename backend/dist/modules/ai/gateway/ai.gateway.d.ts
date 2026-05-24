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
    handlePing(client: Socket, payload: any): void;
}
