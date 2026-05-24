import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { EncryptionService, IEncryptedData } from '../../encryption/service/encryption.service';
import { AiGateway } from '../gateway/ai.gateway'; // Importamos el Gateway
import { AiRepository } from '../repository/ai.repository';
import { IDatosExtraidos } from '../type/ai.type';
import rethusValidator from '../scrapping/rethus.validator';
import adresValidator from '../scrapping/adres.validator';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;

  // Guardrails de la IA: Cero creatividad, formato estricto
  private readonly generationConfig = {
    temperature: 0.0,
    topP: 1,
    topK: 1,
    responseMimeType: 'application/json',
  };

  private readonly systemInstruction = `
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

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
    private readonly aiGateway: AiGateway,       // 1. Inyectamos WebSockets
    private readonly aiRepository: AiRepository, // 2. Inyectamos Base de Datos
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error(
        'Falta la variable GEMINI_API_KEY. Configura una API key valida en el archivo .env.',
      );
      throw new Error('GEMINI_API_KEY no configurada.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Método privado: Se comunica exclusivamente con el LLM de Google
   */
  private async analizarDocumentoConIA(fileBuffer: Buffer, mimeType: string): Promise<any> { // Lo ideal es retornar Promise<IRespuestaIA>
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
    } catch (error) {
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

  /**
   * Método público: Orquesta todo el flujo de validación
   */
  async procesarIncapacidad(fileBuffer: Buffer, mimeType: string): Promise<any> {
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

      // 3. Emitimos el evento en tiempo real
      this.aiGateway.emitirAlertaFraude({
        mensaje: 'Posible alteración o fraude en incapacidad detectada',
        anomalias: resultadoIA.anomalias_detectadas,
        timestamp: new Date()
      });
    }

    let datosEncriptados: IEncryptedData | null = null;
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

    // 4. Guardamos en la base de datos
    const idGenerado = await this.aiRepository.guardar(registroIncapacidad);

    const scrapingResultados = await this.ejecutarValidacionesExternas(
      idGenerado,
      resultadoIA.datos_extraidos,
    );

    return {
      id: idGenerado,
      mensaje: 'Procesamiento completado con éxito',
      estado: resultadoIA.estado,
      requiere_accion_manual: resultadoIA.estado === 'REVISIÓN MANUAL',
      alertas: resultadoIA.anomalias_detectadas,
      scraping: scrapingResultados,
    };
  }
  /**
   * Obtiene una incapacidad por ID y desencripta sus datos clínicos
   */
  async obtenerIncapacidadParaRevision(id: string): Promise<any> {
    // 1. Buscar en BD
    const registro = await this.aiRepository.buscarPorId(id);

    if (!registro) {
      throw new NotFoundException(`La incapacidad con ID ${id} no existe en el sistema.`);
    }

    // 2. Desencriptar los datos sensibles
    let datosDesencriptados = null;
    if (registro.datos_encriptados) {
      try {
        // Le pasamos el objeto exacto que pide tu EncryptionService
        datosDesencriptados = this.encryptionService.decryptData(registro.datos_encriptados);
        this.logger.log('Datos clínicos desencriptados exitosamente con AES-256-GCM.');
      } catch (error) {
        this.logger.error('Error crítico al desencriptar. Posible alteración de la llave.', error);
        throw new Error('No se pudieron leer los datos cifrados del paciente.');
      }
    }

    // 3. Devolvemos el objeto reconstruido (sin el hash ininteligible)
    return {
      id: registro.id,
      estado_ia: registro.estado_ia,
      motivo: registro.motivo,
      anomalias_detectadas: registro.anomalias_detectadas,
      fecha_procesamiento: registro.fecha_procesamiento,
      requiere_verificacion_rethus: registro.requiere_verificacion_rethus,
      datos_extraidos: datosDesencriptados // ¡Aquí va el JSON original legible!
    };
  }
  /**
   * Obtiene todas las incapacidades procesadas permitiendo filtrar por documento o nombre
   */
  async obtenerTodasLasIncapacidades(documento?: string, nombre?: string): Promise<any[]> {
    this.logger.log(`Consultando lista de incapacidades. Filtros activos -> Documento: ${documento || 'Ninguno'}, Nombre: ${nombre || 'Ninguno'}`);

    // 1. Obtener todos los registros encriptados desde la BD
    const registrosCrudos = await this.aiRepository.buscarTodos();

    // 2. Desencriptar y mapear cada registro
    const listaDesencriptada = registrosCrudos.map((registro) => {
      let datosDesencriptados: IDatosExtraidos | null = null;

      if (registro.datos_encriptados) {
        try {
          datosDesencriptados = this.encryptionService.decryptData(registro.datos_encriptados);
        } catch (error) {
          this.logger.error(`Error desencriptando el registro con ID: ${registro.id}`, error);
          // Si falla un registro, se continúa con los demás para no romper el endpoint
        }
      }

      return {
        id: registro.id,
        estado_ia: registro.estado_ia,
        motivo: registro.motivo,
        anomalias_detectadas: registro.anomalias_detectadas,
        fecha_procesamiento: registro.fecha_procesamiento,
        requiere_verificacion_rethus: registro.requiere_verificacion_rethus,
        datos_extraidos: datosDesencriptados, // Datos legibles del paciente
      };
    });

    // 3. Aplicar filtros en memoria basados en los Query Params
    return listaDesencriptada.filter((item) => {
      // Si el registro no tiene datos extraídos (falló la IA), no se puede evaluar por filtros de paciente
      if (!item.datos_extraidos) return false;

      const cumpleDocumento = documento 
        ? item.datos_extraidos.paciente_documento.includes(documento) 
        : true;

      const cumpleNombre = nombre 
        ? item.datos_extraidos.paciente_nombre.toLowerCase().includes(nombre.toLowerCase()) 
        : true;

      return cumpleDocumento && cumpleNombre;
    });
  }

  /**
   * Ejecuta la validación documental en RETHUS y ADRES en paralelo
   * y emite un evento WebSocket cuando ambos finalizan.
   */
  private async ejecutarValidacionesExternas(
    incapacidadId: string,
    datosExtraidos: IDatosExtraidos | null,
  ): Promise<{ rethus: unknown; adres: unknown } | null> {
    if (!datosExtraidos) {
      return null;
    }

    const medicoDocumento = `${datosExtraidos.medico_registro_documento || ''}`.trim();
    const pacienteDocumento = `${datosExtraidos.paciente_documento || ''}`.trim();
    const eps = `${datosExtraidos.eps || ''}`.trim();

    const rethusPromise = medicoDocumento
      ? rethusValidator(medicoDocumento).catch((error: unknown) => ({
          status: false,
          payload: {
            estado: false,
            mensaje: 'No se pudo validar al medico en RETHUS.',
            razon:
              error instanceof Error
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
            razon:
              'La IA no devolvio medico_registro_documento para lanzar el scraping.',
            documento: medicoDocumento,
            fuente: 'RETHUS',
            scrapingExitoso: false,
            fecha: new Date().toISOString(),
            data: null,
          },
        });

    const adresPromise = pacienteDocumento
      ? adresValidator(pacienteDocumento, eps || null).catch((error: unknown) => ({
          status: false,
          payload: {
            estado: false,
            mensaje: 'No se pudo validar la EPS del paciente.',
            razon:
              error instanceof Error
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
}