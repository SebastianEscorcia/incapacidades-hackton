import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiGateway } from '../gateway/ai.gateway';
import { AiRepository } from '../repository/ai.repository';
import { IRespuestaEpsSimulada } from '../type/ai.type';

@Injectable()
export class EpsAiService {
  private readonly logger = new Logger(EpsAiService.name);
  private readonly genAI2: GoogleGenerativeAI;

  private readonly generationConfig = {
    temperature: 0.0,
    topP: 1,
    topK: 1,
    responseMimeType: 'application/json',
  };

  private readonly systemInstruction = `
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

  private readonly baseConocimientoRag = [
    {
      clave: 'GLOSA',
      contenido:
        'Aplicar glosa cuando el documento no cumple integralidad/consistencia para radicacion y debe pasar a reproceso.',
    },
    {
      clave: 'RECHAZADO',
      contenido:
        'Aplicar rechazo cuando existe inconsistencia fuerte, sospecha de alteracion o incompatibilidad grave en validaciones.',
    },
    {
      clave: 'REQUIERE_SOPORTE',
      contenido:
        'Aplicar requiere soporte cuando no hay suficiente evidencia automatica para decidir, y se debe abrir requerimiento.',
    },
    {
      clave: 'APROBADO',
      contenido:
        'Aplicar aprobado cuando no hay anomalias y RETHUS/ADRES presentan consistencia operativa.',
    },
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly aiGateway: AiGateway,
    private readonly aiRepository: AiRepository,
  ) {
    const apiKey2 = this.configService.get<string>('GEMINI_API_KEY2');
    const apiKey1 = this.configService.get<string>('GEMINI_API_KEY');
    const finalKey = apiKey2 || apiKey1;

    if (!finalKey) {
      throw new Error(
        'No se encontraron GEMINI_API_KEY2 ni GEMINI_API_KEY para EpsAiService.',
      );
    }

    if (!apiKey2) {
      this.logger.warn(
        'GEMINI_API_KEY2 no configurada. EpsAiService usara GEMINI_API_KEY como respaldo.',
      );
    }

    this.genAI2 = new GoogleGenerativeAI(finalKey);
  }

  async simularRespuestaEps(
    incapacidadId: string,
    resultadoIA: any,
    scrapingResultados: { rethus: unknown; adres: unknown } | null,
  ): Promise<IRespuestaEpsSimulada> {
    const fallback = this.construirRespuestaEpsFallback(resultadoIA, scrapingResultados);
    try {
      const respuesta = await this.analizarConLlm(
        resultadoIA,
        scrapingResultados,
        fallback,
      );

      await this.aiRepository.actualizarRespuestaEps(incapacidadId, respuesta);
      this.aiGateway.emitirRespuestaEps({
        incapacidadId,
        ...respuesta,
        finalizadoEn: new Date().toISOString(),
      });
      return respuesta;
    } catch (error) {
      this.logger.warn(
        `Simulacion EPS con IA2 fallo. Se aplicara fallback: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      await this.aiRepository.actualizarRespuestaEps(incapacidadId, fallback);
      this.aiGateway.emitirRespuestaEps({
        incapacidadId,
        ...fallback,
        finalizadoEn: new Date().toISOString(),
      });
      return fallback;
    }
  }

  private async analizarConLlm(
    resultadoIA: any,
    scrapingResultados: { rethus: unknown; adres: unknown } | null,
    fallback: IRespuestaEpsSimulada,
  ): Promise<IRespuestaEpsSimulada> {
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
    const parsed = JSON.parse(llmResponse.response.text()) as IRespuestaEpsSimulada;

    const estadoValido =
      parsed.estado_eps_response === 'APROBADO' ||
      parsed.estado_eps_response === 'GLOSA' ||
      parsed.estado_eps_response === 'RECHAZADO' ||
      parsed.estado_eps_response === 'REQUIERE_SOPORTE';

    if (!estadoValido) {
      return fallback;
    }

    return {
      estado_eps_response: parsed.estado_eps_response,
      mensaje: parsed.mensaje || fallback.mensaje,
      requiere_requerimiento:
        parsed.estado_eps_response === 'REQUIERE_SOPORTE'
          ? true
          : Boolean(parsed.requiere_requerimiento),
    };
  }

  private construirContextoRag(
    resultadoIA: any,
    scrapingResultados: { rethus: unknown; adres: unknown } | null,
  ) {
    const etiquetas = ['APROBADO', 'GLOSA', 'RECHAZADO', 'REQUIERE_SOPORTE'];

    const estadoIA = `${resultadoIA?.estado || ''}`.toUpperCase();
    const tieneAnomalias =
      Array.isArray(resultadoIA?.anomalias_detectadas) &&
      resultadoIA.anomalias_detectadas.length > 0;
    const rethusStatus = (scrapingResultados as any)?.rethus?.status;
    const adresStatus = (scrapingResultados as any)?.adres?.status;

    const sugerencias = {
      sugerido:
        estadoIA === 'RECHAZADO' || tieneAnomalias
          ? 'RECHAZADO'
          : rethusStatus === false || adresStatus === false
            ? 'GLOSA'
            : estadoIA === 'REVISIÓN MANUAL' || !resultadoIA?.datos_extraidos
              ? 'REQUIERE_SOPORTE'
              : 'APROBADO',
      motivo:
        estadoIA === 'RECHAZADO' || tieneAnomalias
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

  private construirRespuestaEpsFallback(
    resultadoIA: any,
    scrapingResultados: { rethus: unknown; adres: unknown } | null,
  ): IRespuestaEpsSimulada {
    const tieneAnomalias =
      Array.isArray(resultadoIA?.anomalias_detectadas) &&
      resultadoIA.anomalias_detectadas.length > 0;
    const estadoIA = resultadoIA?.estado;

    const rethusStatus = (scrapingResultados as any)?.rethus?.status;
    const adresStatus = (scrapingResultados as any)?.adres?.status;

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
        mensaje:
          'Documento en glosa: validaciones externas no conformes, queda en reproceso.',
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
}
