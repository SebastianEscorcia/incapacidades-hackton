import { AiService } from '../services/ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    processIncapacidad(file: Express.Multer.File): Promise<any>;
    getIncapacidadParaRevision(id: string): Promise<any>;
    getAllIncapacidades(documento?: string, nombre?: string): Promise<any[]>;
    getDashboardResumenEstados(): Promise<{
        en_proceso: number;
        glosa: number;
        rechazado: number;
        requiere_soporte: number;
        aprobado: number;
        total: number;
    }>;
}
