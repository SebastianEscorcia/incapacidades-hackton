"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AiRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let AiRepository = AiRepository_1 = class AiRepository {
    logger = new common_1.Logger(AiRepository_1.name);
    bdSimulada = new Map();
    async guardar(registro) {
        try {
            this.logger.log('Iniciando guardado de la incapacidad...');
            const id = (0, crypto_1.randomUUID)();
            const registroConId = { ...registro, id };
            this.bdSimulada.set(id, registroConId);
            this.logger.debug(`Incapacidad persistida correctamente con ID: ${id}`);
            return id;
        }
        catch (error) {
            this.logger.error('Error al persistir la incapacidad', error);
            throw new Error('Fallo en la capa de persistencia');
        }
    }
    async buscarPorId(id) {
        this.logger.log(`Buscando incapacidad en BD con ID: ${id}`);
        const registro = this.bdSimulada.get(id);
        return registro || null;
    }
    async buscarTodos() {
        this.logger.log('Recuperando todos los registros crudos de la BD...');
        return Array.from(this.bdSimulada.values());
    }
};
exports.AiRepository = AiRepository;
exports.AiRepository = AiRepository = AiRepository_1 = __decorate([
    (0, common_1.Injectable)()
], AiRepository);
//# sourceMappingURL=ai.repository.js.map