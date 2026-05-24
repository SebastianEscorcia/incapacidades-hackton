export interface IDatosExtraidos {
    paciente_nombre: string;
    paciente_documento: string;
    eps: string;
    diagnostico_codigo: string;
    dias_incapacidad: number;
    fecha_inicio: string;
    fecha_fin: string;
    medico_nombre: string;
    medico_registro_documento: string;
    ips_nombre: string;
}
export interface IRespuestaIA {
    estado: 'APROBADO' | 'RECHAZADO' | 'REVISIÓN MANUAL';
    motivo_rechazo: string | null;
    anomalias_detectadas: string[];
    datos_extraidos: IDatosExtraidos | null;
}
export type EstadoEpsResponse = 'EN_PROCESO' | 'APROBADO' | 'GLOSA' | 'RECHAZADO' | 'REQUIERE_SOPORTE';
export interface IRespuestaEpsSimulada {
    estado_eps_response: EstadoEpsResponse;
    mensaje: string;
    requiere_requerimiento: boolean;
}
export interface IEncryptedData {
    iv: string;
    encryptedData: string;
    authTag: string;
}
