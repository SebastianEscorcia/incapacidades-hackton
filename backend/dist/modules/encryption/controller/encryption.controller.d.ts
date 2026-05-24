import * as encryptionService from '../service/encryption.service';
export declare class EncryptionController {
    private readonly encryptionService;
    constructor(encryptionService: encryptionService.EncryptionService);
    encrypt(data: any): encryptionService.IEncryptedData;
    decrypt(encrypted: encryptionService.IEncryptedData): any;
}
