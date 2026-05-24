"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analizarDocumento = void 0;
const gemini_connection_1 = require("../connection/gemini.connection");
const generationConfig = {
    temperature: 0.0,
    topP: 1,
    topK: 1,
    responseMimeType: 'application/json',
};
const systemInstruction = `
  Eres un sistema experto en auditoría médica en Colombia. Tu único objetivo es analizar imágenes de certificados de incapacidad (EPS SURA, Sanitas, Salud Total) y extraer los datos en formato JSON...
  (Conserva aquí todas las instrucciones estrictas del prompt anterior)
  `;
const analizarDocumento = async (fileBuffer, mimeType) => {
    try {
        const model = gemini_connection_1.genAI.getGenerativeModel({
            model: 'gemini-3.5-flash',
            generationConfig,
            systemInstruction,
        });
        const imagePart = {
            inlineData: {
                data: fileBuffer.toString('base64'),
                mimeType: mimeType,
            },
        };
        const prompt = 'Analiza este documento de incapacidad y devuelve el JSON estructurado según tus instrucciones.';
        const result = await model.generateContent([prompt, imagePart]);
        return JSON.parse(result.response.text());
    }
    catch (error) {
        console.error('Error en el servicio de Gemini:', error);
        return {
            estado: 'REVISIÓN MANUAL',
            motivo_rechazo: 'Fallo interno en el procesamiento de IA.',
            anomalias_detectadas: [],
            datos_extraidos: null
        };
    }
};
exports.analizarDocumento = analizarDocumento;
//# sourceMappingURL=gemini.service.js.map