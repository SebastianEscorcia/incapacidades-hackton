import { 
    WebSocketGateway, 
    WebSocketServer, 
    OnGatewayConnection, 
    OnGatewayDisconnect,
    SubscribeMessage
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Logger, Injectable } from '@nestjs/common';
  
  @Injectable()
  @WebSocketGateway({
    cors: {
      origin: '*', // En producción, ajusta esto al dominio de tu frontend
    },
    namespace: '/incapacidades', // Separación lógica de canales
  })
  export class AiGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(AiGateway.name);
  
    handleConnection(client: Socket) {
      this.logger.log(`Cliente conectado al socket de auditoría: ${client.id}`);
      // Opcional: Unir automáticamente al cliente a una sala de auditores
      client.join('sala_auditores');
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Cliente desconectado: ${client.id}`);
    }
  
    /**
     * Método que llamará el AiService cuando detecte una anomalía
     */
    emitirAlertaFraude(payload: { mensaje: string; anomalias: string[]; timestamp: Date }) {
      this.logger.warn('Emitiendo alerta de fraude por WebSocket...');
      // Emite el evento a todos los clientes en la sala_auditores
      this.server.to('sala_auditores').emit('alerta_fraude', payload);
    }
  
    /**
     * Ejemplo de cómo escuchar eventos desde el frontend (si lo necesitas luego)
     */
    @SubscribeMessage('ping_auditor')
    handlePing(client: Socket, payload: any): void {
      client.emit('pong_auditor', { mensaje: 'Conexión activa con el sistema de IA' });
    }
  }