"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let AiGateway = AiGateway_1 = class AiGateway {
    server;
    logger = new common_1.Logger(AiGateway_1.name);
    handleConnection(client) {
        this.logger.log(`Cliente conectado al socket de auditoría: ${client.id}`);
        client.join('sala_auditores');
    }
    handleDisconnect(client) {
        this.logger.log(`Cliente desconectado: ${client.id}`);
    }
    emitirAlertaFraude(payload) {
        this.logger.warn('Emitiendo alerta de fraude por WebSocket...');
        this.server.to('sala_auditores').emit('alerta_fraude', payload);
    }
    emitirResultadoScraping(payload) {
        this.logger.log('Emitiendo resultado consolidado de scrapers por WebSocket...');
        this.server
            .to('sala_auditores')
            .emit('validacion_documental_completada', payload);
    }
    handlePing(client, payload) {
        client.emit('pong_auditor', { mensaje: 'Conexión activa con el sistema de IA' });
    }
};
exports.AiGateway = AiGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AiGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping_auditor'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AiGateway.prototype, "handlePing", null);
exports.AiGateway = AiGateway = AiGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/incapacidades',
    })
], AiGateway);
//# sourceMappingURL=ai.gateway.js.map