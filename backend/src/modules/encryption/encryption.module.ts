import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './service/encryption.service';

@Global() // Hace que este módulo y sus exports estén disponibles en toda la app
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService], // Fundamental: expone el servicio para que otros módulos lo puedan inyectar
})
export class EncryptionModule {}