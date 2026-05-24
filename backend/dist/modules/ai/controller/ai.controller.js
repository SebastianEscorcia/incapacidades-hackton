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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const ai_service_1 = require("../services/ai.service");
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async processIncapacidad(file) {
        return this.aiService.procesarIncapacidad(file.buffer, file.mimetype);
    }
    async getIncapacidadParaRevision(id) {
        if (!id) {
            throw new common_1.BadRequestException('El ID de la incapacidad es requerido.');
        }
        const detalle = await this.aiService.obtenerIncapacidadParaRevision(id);
        return detalle;
    }
    async getAllIncapacidades(documento, nombre) {
        return await this.aiService.obtenerTodasLasIncapacidades(documento, nombre);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('upload-incapacidad'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('documento', {
        storage: (0, multer_1.memoryStorage)(),
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipeBuilder()
        .addFileTypeValidator({
        fileType: /(jpg|jpeg|png|pdf)$/i,
    })
        .addMaxSizeValidator({
        maxSize: 5 * 1024 * 1024,
    })
        .build({
        fileIsRequired: true,
        errorHttpStatusCode: common_1.HttpStatus.BAD_REQUEST,
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "processIncapacidad", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Get)('incapacidad/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getIncapacidadParaRevision", null);
__decorate([
    (0, common_1.Get)('incapacidades'),
    __param(0, (0, common_1.Query)('paciente_documento')),
    __param(1, (0, common_1.Query)('paciente_nombre')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getAllIncapacidades", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map