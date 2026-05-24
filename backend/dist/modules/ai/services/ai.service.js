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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("@nestjs/config");
const encryption_service_1 = require("../../encryption/service/encryption.service");
const ai_gateway_1 = require("../gateway/ai.gateway");
const ai_repository_1 = require("../repository/ai.repository");
const rethus_validator_1 = __importDefault(require("../scrapping/rethus.validator"));
const adres_validator_1 = __importDefault(require("../scrapping/adres.validator"));
let AiService = AiService_1 = class AiService {
    encryptionService;
    configService;
    aiGateway;
    aiRepository;
    logger = new common_1.Logger(AiService_1.name);
    genAI;
    generationConfig = {
        temperature: 0.0,
        topP: 1,
        topK: 1,
        responseMimeType: 'application/json',
    };
    systemInstruction = `
    Eres un sistema experto en auditoría médica en Colombia. Tu único objetivo es analizar imágenes de certificados de incapacidad y extraer los datos en formato JSON estricto.

  Definición de Fechas (¡CRÍTICO!):
  - "fecha_expedicion": Es el momento en que se emitió o imprimió el documento (suele decir "Fecha", "Fecha de impresión" o "Generación").
  - "fecha_inicio": Es el primer día de reposo del paciente (suele decir "Fecha inicio", "Desde").
  - "fecha_fin": Es el último día de reposo (suele decir "Fecha fin", "Hasta").

  Reglas estrictas de validación (Guardrails):
  1. Completitud: Verifica que los campos obligatorios existan. Si faltan datos críticos o dicen "Vacia", el estado debe ser "REVISIÓN MANUAL".
  2. Coherencia de Fechas: Es normal que la fecha_expedicion sea igual o un poco anterior a la fecha_inicio. NO lo marques como anomalía a menos que la fecha_inicio sea anterior a la fecha_expedicion (ej. la incapacidad empezó el día 01, pero se emitió el día 05 sin justificación de transcripción).
  3. Lógica de Días: Si fecha_inicio y fecha_fin son iguales, los días de incapacidad deben ser 1.
  4. Estado Estricto: Si detectas CUALQUIER anomalía o inconsistencia, el "estado" NO PUEDE SER "APROBADO". Debe ser obligatoriamente "REVISIÓN MANUAL" o "RECHAZADO".

    Estructura obligatoria del JSON de respuesta:
    {
      "estado": "APROBADO | RECHAZADO | REVISIÓN MANUAL",
      "motivo_rechazo": "Razón detallada si aplica, o null",
      "anomalias_detectadas": ["Lista de alertas de fraude o incoherencias"],
      "datos_extraidos": {
        "paciente_nombre": "",
        "paciente_documento": "",
        "eps": "",
        "diagnostico_codigo": "",
        "dias_incapacidad": 0,
        "fecha_inicio": "",
        "fecha_fin": "",
        "medico_nombre": "",
        "medico_registro_documento": "",
        "ips_nombre": ""
      }
    }
  `;
    constructor(encryptionService, configService, aiGateway, aiRepository) {
        this.encryptionService = encryptionService;
        this.configService = configService;
        this.aiGateway = aiGateway;
        this.aiRepository = aiRepository;
        const apiKey = this.configService.get('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('Falta la variable GEMINI_API_KEY. Configura una API key valida en el archivo .env.');
            throw new Error('GEMINI_API_KEY no configurada.');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async analizarDocumentoConIA(fileBuffer, mimeType) {
        try {
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-3.5-flash',
                generationConfig: this.generationConfig,
                systemInstruction: this.systemInstruction,
            });
            const imagePart = {
                inlineData: {
                    data: fileBuffer.toString('base64'),
                    mimeType: mimeType,
                },
            };
            const prompt = 'Analiza este documento de incapacidad y devuelve el JSON estructurado según tus instrucciones.';
            const result = await model.generateContent([prompt, imagePart]);
            return JSON.parse(result.response.text());
        }
        catch (error) {
            this.logger.error('Error procesando el documento con Gemini', error);
            let motivoError = 'Fallo interno en el procesamiento de IA o documento ilegible.';
            if (error instanceof Error) {
                motivoError = error.message.includes('403')
                    ? 'La validacion IA fallo por API key invalida/revocada (Gemini 403).'
                    : `Fallo en IA: ${error.message}`;
            }
            return {
                estado: 'REVISIÓN MANUAL',
                motivo_rechazo: motivoError,
                anomalias_detectadas: [],
                datos_extraidos: null
            };
        }
    }
    async procesarIncapacidad(fileBuffer, mimeType) {
        this.logger.log('Iniciando procesamiento de incapacidad...');
        const resultadoIA = await this.analizarDocumentoConIA(fileBuffer, mimeType);
        if (resultadoIA.anomalias_detectadas.length > 0 && resultadoIA.estado === 'APROBADO') {
            this.logger.warn('La IA aprobó el documento pero encontró anomalías. Forzando REVISIÓN MANUAL.');
            resultadoIA.estado = 'REVISIÓN MANUAL';
            resultadoIA.motivo_rechazo = 'Se detectaron anomalías automáticas que requieren auditoría humana.';
        }
        const esFraude = resultadoIA.estado === 'RECHAZADO' || resultadoIA.anomalias_detectadas.length > 0;
        if (esFraude) {
            this.logger.warn(`Anomalías detectadas: ${resultadoIA.anomalias_detectadas.join(', ')}`);
            this.aiGateway.emitirAlertaFraude({
                mensaje: 'Posible alteración o fraude en incapacidad detectada',
                anomalias: resultadoIA.anomalias_detectadas,
                timestamp: new Date()
            });
        }
        let datosEncriptados = null;
        if (resultadoIA.datos_extraidos) {
            datosEncriptados = this.encryptionService.encryptData(resultadoIA.datos_extraidos);
        }
        const registroIncapacidad = {
            estado_ia: resultadoIA.estado,
            motivo: resultadoIA.motivo_rechazo,
            datos_encriptados: datosEncriptados,
            anomalias_detectadas: resultadoIA.anomalias_detectadas,
            fecha_procesamiento: new Date(),
            requiere_verificacion_rethus: resultadoIA.estado === 'APROBADO',
        };
        const idGenerado = await this.aiRepository.guardar(registroIncapacidad);
        const scrapingResultados = await this.ejecutarValidacionesExternas(idGenerado, resultadoIA.datos_extraidos);
        return {
            id: idGenerado,
            mensaje: 'Procesamiento completado con éxito',
            estado: resultadoIA.estado,
            requiere_accion_manual: resultadoIA.estado === 'REVISIÓN MANUAL',
            alertas: resultadoIA.anomalias_detectadas,
            scraping: scrapingResultados,
        };
    }
    async obtenerIncapacidadParaRevision(id) {
        const registro = await this.aiRepository.buscarPorId(id);
        if (!registro) {
            throw new common_1.NotFoundException(`La incapacidad con ID ${id} no existe en el sistema.`);
        }
        let datosDesencriptados = null;
        if (registro.datos_encriptados) {
            try {
                datosDesencriptados = this.encryptionService.decryptData(registro.datos_encriptados);
                this.logger.log('Datos clínicos desencriptados exitosamente con AES-256-GCM.');
            }
            catch (error) {
                this.logger.error('Error crítico al desencriptar. Posible alteración de la llave.', error);
                throw new Error('No se pudieron leer los datos cifrados del paciente.');
            }
        }
        return {
            id: registro.id,
            estado_ia: registro.estado_ia,
            motivo: registro.motivo,
            anomalias_detectadas: registro.anomalias_detectadas,
            fecha_procesamiento: registro.fecha_procesamiento,
            requiere_verificacion_rethus: registro.requiere_verificacion_rethus,
            datos_extraidos: datosDesencriptados
        };
    }
    async obtenerTodasLasIncapacidades(documento, nombre) {
        this.logger.log(`Consultando lista de incapacidades. Filtros activos -> Documento: ${documento || 'Ninguno'}, Nombre: ${nombre || 'Ninguno'}`);
        const registrosCrudos = await this.aiRepository.buscarTodos();
        const listaDesencriptada = registrosCrudos.map((registro) => {
            let datosDesencriptados = null;
            if (registro.datos_encriptados) {
                try {
                    datosDesencriptados = this.encryptionService.decryptData(registro.datos_encriptados);
                }
                catch (error) {
                    this.logger.error(`Error desencriptando el registro con ID: ${registro.id}`, error);
                }
            }
            return {
                id: registro.id,
                estado_ia: registro.estado_ia,
                motivo: registro.motivo,
                anomalias_detectadas: registro.anomalias_detectadas,
                fecha_procesamiento: registro.fecha_procesamiento,
                requiere_verificacion_rethus: registro.requiere_verificacion_rethus,
                datos_extraidos: datosDesencriptados,
            };
        });
        return listaDesencriptada.filter((item) => {
            if (!item.datos_extraidos)
                return false;
            const cumpleDocumento = documento
                ? item.datos_extraidos.paciente_documento.includes(documento)
                : true;
            const cumpleNombre = nombre
                ? item.datos_extraidos.paciente_nombre.toLowerCase().includes(nombre.toLowerCase())
                : true;
            return cumpleDocumento && cumpleNombre;
        });
    }
    async ejecutarValidacionesExternas(incapacidadId, datosExtraidos) {
        if (!datosExtraidos) {
            return null;
        }
        const medicoDocumento = `${datosExtraidos.medico_registro_documento || ''}`.trim();
        const pacienteDocumento = `${datosExtraidos.paciente_documento || ''}`.trim();
        const eps = `${datosExtraidos.eps || ''}`.trim();
        const rethusPromise = medicoDocumento
            ? (0, rethus_validator_1.default)(medicoDocumento).catch((error) => ({
                status: false,
                payload: {
                    estado: false,
                    mensaje: 'No se pudo validar al medico en RETHUS.',
                    razon: error instanceof Error
                        ? error.message
                        : 'Error desconocido ejecutando scraper RETHUS.',
                    documento: medicoDocumento,
                    fuente: 'RETHUS',
                    scrapingExitoso: false,
                    fecha: new Date().toISOString(),
                    data: null,
                },
            }))
            : Promise.resolve({
                status: false,
                payload: {
                    estado: false,
                    mensaje: 'No se ejecuta RETHUS: falta medico_registro_documento.',
                    razon: 'La IA no devolvio medico_registro_documento para lanzar el scraping.',
                    documento: medicoDocumento,
                    fuente: 'RETHUS',
                    scrapingExitoso: false,
                    fecha: new Date().toISOString(),
                    data: null,
                },
            });
        const adresPromise = pacienteDocumento
            ? (0, adres_validator_1.default)(pacienteDocumento, eps || null).catch((error) => ({
                status: false,
                payload: {
                    estado: false,
                    mensaje: 'No se pudo validar la EPS del paciente.',
                    razon: error instanceof Error
                        ? error.message
                        : 'Error desconocido ejecutando scraper ADRES.',
                    documento: pacienteDocumento,
                    epsValidada: eps || null,
                    fuente: 'ADRES',
                    scrapingExitoso: false,
                    fecha: new Date().toISOString(),
                    data: null,
                },
            }))
            : Promise.resolve({
                status: false,
                payload: {
                    estado: false,
                    mensaje: 'No se ejecuta ADRES: falta paciente_documento.',
                    razon: 'La IA no devolvio paciente_documento para lanzar el scraping.',
                    documento: pacienteDocumento,
                    epsValidada: eps || null,
                    fuente: 'ADRES',
                    scrapingExitoso: false,
                    fecha: new Date().toISOString(),
                    data: null,
                },
            });
        const [rethus, adres] = await Promise.all([rethusPromise, adresPromise]);
        this.aiGateway.emitirResultadoScraping({
            incapacidadId,
            medico_registro_documento: medicoDocumento,
            paciente_documento: pacienteDocumento,
            eps,
            rethus,
            adres,
            finalizadoEn: new Date().toISOString(),
        });
        return { rethus, adres };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [encryption_service_1.EncryptionService,
        config_1.ConfigService,
        ai_gateway_1.AiGateway,
        ai_repository_1.AiRepository])
], AiService);
//# sourceMappingURL=ai.service.js.map