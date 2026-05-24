import { IEncryptedData } from '../../encryption/service/encryption.service';
export interface IRegistroIncapacidad {
    id?: string;
    estado_ia: 'APROBADO' | 'RECHAZADO' | 'REVISIÓN MANUAL';
    motivo: string | null;
    datos_encriptados: IEncryptedData | null;
    anomalias_detectadas: string[];
    fecha_procesamiento: Date;
    requiere_verificacion_rethus: boolean;
}
export declare class AiRepository {
    private readonly logger;
    private readonly bdSimulada;
    guardar(registro: IRegistroIncapacidad): Promise<string>;
    buscarPorId(id: string): Promise<IRegistroIncapacidad | null>;
    buscarTodos(): Promise<IRegistroIncapacidad[]>;
}
