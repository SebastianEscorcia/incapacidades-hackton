import { Controller, Post, Body } from '@nestjs/common';
import * as encryptionService from '../service/encryption.service';

@Controller('crypto')
export class EncryptionController {
  constructor(private readonly encryptionService: encryptionService.EncryptionService) {}

  @Post('encrypt')
  encrypt(@Body() data: any): encryptionService.IEncryptedData {
    return this.encryptionService.encryptData(data);
  }

  @Post('decrypt')
  decrypt(@Body() encrypted: encryptionService.IEncryptedData): any {
    return this.encryptionService.decryptData(encrypted);
  }
}
