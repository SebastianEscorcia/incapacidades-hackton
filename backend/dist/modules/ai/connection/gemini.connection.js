"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genAI = void 0;
const generative_ai_1 = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
    console.warn('Advertencia: GEMINI_API_KEY no está definida en las variables de entorno.');
}
exports.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
//# sourceMappingURL=gemini.connection.js.map