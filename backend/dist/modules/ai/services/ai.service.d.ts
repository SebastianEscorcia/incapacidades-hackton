import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../encryption/service/encryption.service';
import { AiGateway } from '../gateway/ai.gateway';
import { AiRepository } from '../repository/ai.repository';
import { EpsAiService } from './eps-ai.service';
export declare class AiService {
    private readonly encryptionService;
    private readonly configService;
    private readonly aiGateway;
    private readonly aiRepository;
    private readonly epsAiService;
    private readonly logger;
    private readonly genAI;
    private readonly generationConfig;
    private readonly systemInstruction;
    constructor(encryptionService: EncryptionService, configService: ConfigService, aiGateway: AiGateway, aiRepository: AiRepository, epsAiService: EpsAiService);
    private analizarDocumentoConIA;
    procesarIncapacidad(fileBuffer: Buffer, mimeType: string): Promise<any>;
    obtenerIncapacidadParaRevision(id: string): Promise<any>;
    obtenerTodasLasIncapacidades(documento?: string, nombre?: string): Promise<any[]>;
    private ejecutarValidacionesExternas;
    obtenerResumenDashboard(): Promise<{
        en_proceso: number;
        glosa: number;
        rechazado: number;
        requiere_soporte: number;
        aprobado: number;
        total: number;
    }>;
}
