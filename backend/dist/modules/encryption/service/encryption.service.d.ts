export interface IEncryptedData {
    iv: string;
    encryptedData: string;
    authTag: string;
}
export declare class EncryptionService {
    private readonly algorithm;
    private readonly key;
    constructor();
    encryptData(dataObject: any): IEncryptedData;
    decryptData(encrypted: IEncryptedData): any;
}
