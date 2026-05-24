import { Module } from '@nestjs/common';
import { AiController } from './modules/ai/controller/ai.controller';
import { AiService } from './modules/ai/services/ai.service';
import { AiRepository } from './modules/ai/repository/ai.repository';
import { AiGateway } from './modules/ai/gateway/ai.gateway';
import { EncryptionService } from './modules/encryption/service/encryption.service';
import { AiModule } from './modules/ai/ai.module';
import { EncryptionModule } from './modules/encryption/encryption.module';


@Module({
  imports: [AiModule, EncryptionModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
