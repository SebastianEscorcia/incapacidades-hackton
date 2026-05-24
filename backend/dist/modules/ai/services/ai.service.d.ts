import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../encryption/service/encryption.service';
import { AiGateway } from '../gateway/ai.gateway';
import { AiRepository } from '../repository/ai.repository';
export declare class AiService {
    private readonly encryptionService;
    private readonly configService;
    private readonly aiGateway;
    private readonly aiRepository;
    private readonly logger;
    private readonly genAI;
    private readonly generationConfig;
    private readonly systemInstruction;
    constructor(encryptionService: EncryptionService, configService: ConfigService, aiGateway: AiGateway, aiRepository: AiRepository);
    private analizarDocumentoConIA;
    procesarIncapacidad(fileBuffer: Buffer, mimeType: string): Promise<any>;
    obtenerIncapacidadParaRevision(id: string): Promise<any>;
    obtenerTodasLasIncapacidades(documento?: string, nombre?: string): Promise<any[]>;
}
