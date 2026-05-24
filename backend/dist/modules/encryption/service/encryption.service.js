"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = __importDefault(require("crypto"));
let EncryptionService = class EncryptionService {
    algorithm = 'aes-256-gcm';
    key;
    constructor() {
        const keyHex = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        this.key = Buffer.from(keyHex, 'hex');
    }
    encryptData(dataObject) {
        const iv = crypto_1.default.randomBytes(12);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(JSON.stringify(dataObject), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted,
            authTag,
        };
    }
    decryptData(encrypted) {
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.key, Buffer.from(encrypted.iv, 'hex'));
        decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
        let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map