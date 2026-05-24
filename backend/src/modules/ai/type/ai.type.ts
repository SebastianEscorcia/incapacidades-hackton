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
  
  export interface IEncryptedData {
    iv: string;
    encryptedData: string;
    authTag: string;
  }