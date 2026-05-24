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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpsAiController = void 0;
const common_1 = require("@nestjs/common");
const eps_ai_service_1 = require("../services/eps-ai.service");
let EpsAiController = class EpsAiController {
    epsAiService;
    constructor(epsAiService) {
        this.epsAiService = epsAiService;
    }
    async simularRespuesta(body) {
        const incapacidadId = body?.incapacidadId || 'manual-sim';
        const resultadoIA = body?.resultadoIA || null;
        const scrapingResultados = body?.scrapingResultados || null;
        const epsResponse = await this.epsAiService.simularRespuestaEps(incapacidadId, resultadoIA, scrapingResultados);
        return {
            incapacidadId,
            eps_response: epsResponse,
        };
    }
};
exports.EpsAiController = EpsAiController;
__decorate([
    (0, common_1.Post)('simular-respuesta'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EpsAiController.prototype, "simularRespuesta", null);
exports.EpsAiController = EpsAiController = __decorate([
    (0, common_1.Controller)('eps-ai'),
    __metadata("design:paramtypes", [eps_ai_service_1.EpsAiService])
], EpsAiController);
//# sourceMappingURL=eps-ai.controller.js.map