import { ConfigService } from '@nestjs/config';
import { AiGateway } from '../gateway/ai.gateway';
import { AiRepository } from '../repository/ai.repository';
import { IRespuestaEpsSimulada } from '../type/ai.type';
export declare class EpsAiService {
    private readonly configService;
    private readonly aiGateway;
    private readonly aiRepository;
    private readonly logger;
    private readonly genAI2;
    private readonly generationConfig;
    private readonly systemInstruction;
    private readonly baseConocimientoRag;
    constructor(configService: ConfigService, aiGateway: AiGateway, aiRepository: AiRepository);
    simularRespuestaEps(incapacidadId: string, resultadoIA: any, scrapingResultados: {
        rethus: unknown;
        adres: unknown;
    } | null): Promise<IRespuestaEpsSimulada>;
    private analizarConLlm;
    private construirContextoRag;
    private construirRespuestaEpsFallback;
}
