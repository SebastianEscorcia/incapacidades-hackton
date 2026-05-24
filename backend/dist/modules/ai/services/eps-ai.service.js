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
var EpsAiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpsAiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const ai_gateway_1 = require("../gateway/ai.gateway");
const ai_repository_1 = require("../repository/ai.repository");
let EpsAiService = EpsAiService_1 = class EpsAiService {
    configService;
    aiGateway;
    aiRepository;
    logger = new common_1.Logger(EpsAiService_1.name);
    genAI2;
    generationConfig = {
        temperature: 0.0,
        topP: 1,
        topK: 1,
        responseMimeType: 'application/json',
    };
    systemInstruction = `
    Eres el motor experto de respuesta EPS para incapacidades en Colombia.
    Tu salida debe ser estrictamente JSON y sin texto adicional.

    Formato obligatorio:
    {
      "estado_eps_response": "APROBADO | GLOSA | RECHAZADO | REQUIERE_SOPORTE",
      "mensaje": "Explicacion corta, clara y operativa para el area de auditoria",
      "requiere_requerimiento": true | false
    }

    Reglas:
    - GLOSA: documento invalido para pago o con necesidad de reproceso.
    - RECHAZADO: evidencia fuerte de inconsistencia o fraude.
    - REQUIERE_SOPORTE: cuando falta informacion critica o se requiere soporte humano.
      En este estado requiere_requerimiento debe ser true.
    - APROBADO: todo consistente entre IA y validaciones externas.
  `;
    baseConocimientoRag = [
        {
            clave: 'GLOSA',
            contenido: 'Aplicar glosa cuando el documento no cumple integralidad/consistencia para radicacion y debe pasar a reproceso.',
        },
        {
            clave: 'RECHAZADO',
            contenido: 'Aplicar rechazo cuando existe inconsistencia fuerte, sospecha de alteracion o incompatibilidad grave en validaciones.',
        },
        {
            clave: 'REQUIERE_SOPORTE',
            contenido: 'Aplicar requiere soporte cuando no hay suficiente evidencia automatica para decidir, y se debe abrir requerimiento.',
        },
        {
            clave: 'APROBADO',
            contenido: 'Aplicar aprobado cuando no hay anomalias y RETHUS/ADRES presentan consistencia operativa.',
        },
    ];
    constructor(configService, aiGateway, aiRepository) {
        this.configService = configService;
        this.aiGateway = aiGateway;
        this.aiRepository = aiRepository;
        const apiKey2 = this.configService.get('GEMINI_API_KEY2');
        const apiKey1 = this.configService.get('GEMINI_API_KEY');
        const finalKey = apiKey2 || apiKey1;
        if (!finalKey) {
            throw new Error('No se encontraron GEMINI_API_KEY2 ni GEMINI_API_KEY para EpsAiService.');
        }
        if (!apiKey2) {
            this.logger.warn('GEMINI_API_KEY2 no configurada. EpsAiService usara GEMINI_API_KEY como respaldo.');
        }
        this.genAI2 = new generative_ai_1.GoogleGenerativeAI(finalKey);
    }
    async simularRespuestaEps(incapacidadId, resultadoIA, scrapingResultados) {
        const fallback = this.construirRespuestaEpsFallback(resultadoIA, scrapingResultados);
        try {
            const respuesta = await this.analizarConLlm(resultadoIA, scrapingResultados, fallback);
            await this.aiRepository.actualizarRespuestaEps(incapacidadId, respuesta);
            this.aiGateway.emitirRespuestaEps({
                incapacidadId,
                ...respuesta,
                finalizadoEn: new Date().toISOString(),
            });
            return respuesta;
        }
        catch (error) {
            this.logger.warn(`Simulacion EPS con IA2 fallo. Se aplicara fallback: ${error instanceof Error ? error.message : 'error desconocido'}`);
            await this.aiRepository.actualizarRespuestaEps(incapacidadId, fallback);
            this.aiGateway.emitirRespuestaEps({
                incapacidadId,
                ...fallback,
                finalizadoEn: new Date().toISOString(),
            });
            return fallback;
        }
    }
    async analizarConLlm(resultadoIA, scrapingResultados, fallback) {
        const model = this.genAI2.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: this.generationConfig,
            systemInstruction: this.systemInstruction,
        });
        const contextoRag = this.construirContextoRag(resultadoIA, scrapingResultados);
        const prompt = `
      Usa la siguiente base de conocimiento de negocio (RAG interno):
      ${JSON.stringify(contextoRag)}

      Entrada de evaluacion:
      ${JSON.stringify({ resultadoIA, scrapingResultados })}

      Responde solo JSON valido con el formato solicitado.
    `;
        const llmResponse = await model.generateContent(prompt);
        const parsed = JSON.parse(llmResponse.response.text());
        const estadoValido = parsed.estado_eps_response === 'APROBADO' ||
            parsed.estado_eps_response === 'GLOSA' ||
            parsed.estado_eps_response === 'RECHAZADO' ||
            parsed.estado_eps_response === 'REQUIERE_SOPORTE';
        if (!estadoValido) {
            return fallback;
        }
        return {
            estado_eps_response: parsed.estado_eps_response,
            mensaje: parsed.mensaje || fallback.mensaje,
            requiere_requerimiento: parsed.estado_eps_response === 'REQUIERE_SOPORTE'
                ? true
                : Boolean(parsed.requiere_requerimiento),
        };
    }
    construirContextoRag(resultadoIA, scrapingResultados) {
        const etiquetas = ['APROBADO', 'GLOSA', 'RECHAZADO', 'REQUIERE_SOPORTE'];
        const estadoIA = `${resultadoIA?.estado || ''}`.toUpperCase();
        const tieneAnomalias = Array.isArray(resultadoIA?.anomalias_detectadas) &&
            resultadoIA.anomalias_detectadas.length > 0;
        const rethusStatus = scrapingResultados?.rethus?.status;
        const adresStatus = scrapingResultados?.adres?.status;
        const sugerencias = {
            sugerido: estadoIA === 'RECHAZADO' || tieneAnomalias
                ? 'RECHAZADO'
                : rethusStatus === false || adresStatus === false
                    ? 'GLOSA'
                    : estadoIA === 'REVISIÓN MANUAL' || !resultadoIA?.datos_extraidos
                        ? 'REQUIERE_SOPORTE'
                        : 'APROBADO',
            motivo: estadoIA === 'RECHAZADO' || tieneAnomalias
                ? 'Inconsistencias o anomalias detectadas por IA.'
                : rethusStatus === false || adresStatus === false
                    ? 'Al menos una validacion externa no conforme.'
                    : estadoIA === 'REVISIÓN MANUAL' || !resultadoIA?.datos_extraidos
                        ? 'Informacion insuficiente para decision automatica.'
                        : 'No hay hallazgos relevantes en IA y validaciones.',
        };
        return {
            etiquetas_permitidas: etiquetas,
            base_conocimiento: this.baseConocimientoRag,
            sugerencias,
        };
    }
    construirRespuestaEpsFallback(resultadoIA, scrapingResultados) {
        const tieneAnomalias = Array.isArray(resultadoIA?.anomalias_detectadas) &&
            resultadoIA.anomalias_detectadas.length > 0;
        const estadoIA = resultadoIA?.estado;
        const rethusStatus = scrapingResultados?.rethus?.status;
        const adresStatus = scrapingResultados?.adres?.status;
        if (estadoIA === 'RECHAZADO' || tieneAnomalias) {
            return {
                estado_eps_response: 'RECHAZADO',
                mensaje: 'La incapacidad fue rechazada por inconsistencias detectadas.',
                requiere_requerimiento: false,
            };
        }
        if (rethusStatus === false || adresStatus === false) {
            return {
                estado_eps_response: 'GLOSA',
                mensaje: 'Documento en glosa: validaciones externas no conformes, queda en reproceso.',
                requiere_requerimiento: false,
            };
        }
        if (estadoIA === 'REVISIÓN MANUAL' || !resultadoIA?.datos_extraidos) {
            return {
                estado_eps_response: 'REQUIERE_SOPORTE',
                mensaje: 'Se requiere soporte para completar la evaluacion de la incapacidad.',
                requiere_requerimiento: true,
            };
        }
        return {
            estado_eps_response: 'APROBADO',
            mensaje: 'Incapacidad validada y aprobada por simulacion EPS.',
            requiere_requerimiento: false,
        };
    }
};
exports.EpsAiService = EpsAiService;
exports.EpsAiService = EpsAiService = EpsAiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        ai_gateway_1.AiGateway,
        ai_repository_1.AiRepository])
], EpsAiService);
//# sourceMappingURL=eps-ai.service.js.map