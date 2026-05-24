import { Injectable, Logger } from '@nestjs/common';
import { IEncryptedData } from '../../encryption/service/encryption.service';
import { randomUUID } from 'crypto';

export interface IRegistroIncapacidad {
  id?: string; // Añadimos el ID opcional
  estado_ia: 'APROBADO' | 'RECHAZADO' | 'REVISIÓN MANUAL';
  motivo: string | null;
  datos_encriptados: IEncryptedData | null;
  anomalias_detectadas: string[];
  fecha_procesamiento: Date;
  requiere_verificacion_rethus: boolean;
}

@Injectable()
export class AiRepository {
  private readonly logger = new Logger(AiRepository.name);
  
  // Base de datos temporal en memoria para poder probar el GET
  private readonly bdSimulada = new Map<string, IRegistroIncapacidad>();

  // Cambiamos Promise<void> por Promise<string> para devolver el ID generado
  async guardar(registro: IRegistroIncapacidad): Promise<string> {
    try {
      this.logger.log('Iniciando guardado de la incapacidad...');
      
      const id = randomUUID();
      const registroConId = { ...registro, id };
      
      // Guardamos en nuestro Map temporal
      this.bdSimulada.set(id, registroConId);
      
      this.logger.debug(`Incapacidad persistida correctamente con ID: ${id}`);
      return id; // Devolvemos el ID
    } catch (error) {
      this.logger.error('Error al persistir la incapacidad', error);
      throw new Error('Fallo en la capa de persistencia');
    }
  }

  // Nuevo método para buscar por ID
  async buscarPorId(id: string): Promise<IRegistroIncapacidad | null> {
    this.logger.log(`Buscando incapacidad en BD con ID: ${id}`);
    const registro = this.bdSimulada.get(id);
    return registro || null;
  }

  /**
   * Obtiene todos los registros crudos de la base de datos
   */
  async buscarTodos(): Promise<IRegistroIncapacidad[]> {
    this.logger.log('Recuperando todos los registros crudos de la BD...');
    return Array.from(this.bdSimulada.values());
  }
}