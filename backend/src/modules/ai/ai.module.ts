import { Module } from '@nestjs/common';
import { AiController } from './controller/ai.controller';
import { AiService } from './services/ai.service';
import { AiGateway } from './gateway/ai.gateway';
import { AiRepository } from './repository/ai.repository';
import { ConfigService } from '@nestjs/config';
// import { TypeOrmModule } from '@nestjs/typeorm'; // Descomenta si usas TypeORM
// import { IncapacidadEntity } from './entity/incapacidad.entity'; // Descomenta si usas TypeORM

@Module({
  imports: [
    // Si usaras TypeORM, aquí registrarías tu entidad:
    // TypeOrmModule.forFeature([IncapacidadEntity])
  ],
  controllers: [
    AiController // 1. Registramos el endpoint HTTP
  ],
  providers: [
    ConfigService,
    AiService,      // 2. Registramos la lógica principal
    AiGateway,      // 3. Registramos las alertas WebSocket
    AiRepository    // 4. Registramos la capa de base de datos
  ],
  exports: [
    // Si algún otro módulo necesita usar AiService en el futuro, lo exportas aquí
  ]
})
export class AiModule {}