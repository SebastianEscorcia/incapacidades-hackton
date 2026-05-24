import { Global, Injectable } from '@nestjs/common';
import crypto from 'crypto';
export interface IEncryptedData {
    iv: string;
    encryptedData: string;
    authTag: string;
  }
  @Global()
  @Injectable()
  export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;
  
    constructor() {
      const keyHex = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      this.key = Buffer.from(keyHex, 'hex');
    }
  
    encryptData(dataObject: any): IEncryptedData {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
  
      let encrypted = cipher.update(JSON.stringify(dataObject), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
  
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag,
      };
    }
  
    decryptData(encrypted: IEncryptedData): any {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(encrypted.iv, 'hex'),
      );
      decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  
      let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
  
      return JSON.parse(decrypted);
    }
  }