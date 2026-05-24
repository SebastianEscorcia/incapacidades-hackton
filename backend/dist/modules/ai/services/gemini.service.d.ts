import { IRespuestaIA } from '../type/ai.type';
export declare const analizarDocumento: (fileBuffer: Buffer, mimeType: string) => Promise<IRespuestaIA>;
