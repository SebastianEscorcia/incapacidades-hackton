import { EpsAiService } from '../services/eps-ai.service';
export declare class EpsAiController {
    private readonly epsAiService;
    constructor(epsAiService: EpsAiService);
    simularRespuesta(body: any): Promise<{
        incapacidadId: any;
        eps_response: import("../type/ai.type").IRespuestaEpsSimulada;
    }>;
}
