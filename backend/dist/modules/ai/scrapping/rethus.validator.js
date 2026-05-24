"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rethusValidator;
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const TIPO_DOC = 'CC';
const OUTPUT = path.join(__dirname, 'rethus_result.json');
function normalizeText(value = '') {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
function buildResponse({ status, message, reason = undefined, document, scraping = true, data = undefined, }) {
    return {
        status,
        payload: {
            estado: status,
            mensaje: message,
            razon: reason,
            documento: document,
            fuente: 'RETHUS',
            scrapingExitoso: scraping,
            fecha: new Date().toISOString(),
            data,
        },
    };
}
function validateRethusResult(textResult = '') {
    const normalized = normalizeText(textResult);
    if (!normalized) {
        return {
            status: false,
            message: 'No se pudo validar el medico en RETHUS.',
            reason: 'La consulta no devolvio texto de resultado.',
        };
    }
    const negativePatterns = [
        /no\s+se\s+encuentra/,
        /no\s+registra/,
        /no\s+aparece/,
        /no\s+pertenece/,
        /sin\s+resultados/,
        /no\s+existe/,
    ];
    if (negativePatterns.some((pattern) => pattern.test(normalized))) {
        return {
            status: false,
            message: 'El medico no pertenece al RETHUS.',
            reason: 'La respuesta oficial de RETHUS no reporta registro vigente para el documento consultado.',
        };
    }
    const positivePatterns = [
        /se\s+encuentra/,
        /registro/,
        /inscrito/,
        /talento\s+humano\s+en\s+salud/,
    ];
    if (positivePatterns.some((pattern) => pattern.test(normalized))) {
        return {
            status: true,
            message: 'Todo esta correcto: el medico aparece en RETHUS.',
            reason: null,
        };
    }
    return {
        status: false,
        message: 'No se pudo confirmar si el medico pertenece al RETHUS.',
        reason: 'La respuesta de RETHUS fue ambigua y no pudo clasificarse de forma confiable.',
    };
}
async function rethusValidator(docNumber) {
    console.log('Iniciando navegador...');
    let browser;
    try {
        browser = await chromium.launch({
            headless: false,
            slowMo: 80,
            args: ['--disable-blink-features=AutomationControlled'],
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        });
        const page = await context.newPage();
        await page.goto('https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise((r) => setTimeout(r, 1500));
        await page.waitForSelector('#ctl00_cntContenido_ddlTipoIdentificacion');
        await page.selectOption('#ctl00_cntContenido_ddlTipoIdentificacion', TIPO_DOC);
        await new Promise((r) => setTimeout(r, 800));
        const inputDoc = page.locator('#ctl00_cntContenido_txtNumeroIdentificacion');
        await inputDoc.waitFor({ state: 'visible', timeout: 15000 });
        await inputDoc.click({ force: true });
        await inputDoc.fill('');
        await inputDoc.type(docNumber, { delay: 100 });
        await new Promise((r) => setTimeout(r, 800));
        await page.waitForSelector('#imgCaptcha', { state: 'visible', timeout: 20000 });
        const captchaValue = await page.evaluate(() => {
            const img = document.querySelector('#imgCaptcha');
            if (!img)
                return null;
            const src = img.getAttribute('src') || '';
            const match = src.match(/[?&]pC=([^&]+)/);
            return match ? match[1] : null;
        });
        if (!captchaValue) {
            throw new Error('No se pudo extraer el valor pC del src de #imgCaptcha');
        }
        const captchaInputId = await page.evaluate((numDoc) => {
            const asInput = (el) => el && el.tagName === 'INPUT' ? (el) : null;
            const img = document.querySelector('#imgCaptcha');
            if (img) {
                let node = img.nextElementSibling;
                while (node) {
                    const nodeInput = asInput(node);
                    if (nodeInput && (nodeInput.type === 'text' || !nodeInput.type)) {
                        return nodeInput.id
                            ? `#${nodeInput.id}`
                            : `[name="${nodeInput.name}"]`;
                    }
                    const inp = (node.querySelector('input[type="text"], input:not([type])'));
                    if (inp)
                        return inp.id ? `#${inp.id}` : `[name="${inp.name}"]`;
                    node = node.nextElementSibling;
                }
                const parent = img.closest('tr, div, td, span');
                if (parent) {
                    const inp = (parent.querySelector('input[type="text"], input:not([type])'));
                    if (inp)
                        return inp.id ? `#${inp.id}` : `[name="${inp.name}"]`;
                }
            }
            const inputs = (Array.from(document.querySelectorAll('input[type="text"], input:not([type])')));
            for (const inp of inputs) {
                if (inp.value !== numDoc && !inp.id.toLowerCase().includes('identificacion')) {
                    return inp.id ? '#' + inp.id : `[name="${inp.name}"]`;
                }
            }
            return null;
        }, docNumber);
        if (!captchaInputId) {
            throw new Error('No se pudo hacer el web scraping: no se encontro el campo para ingresar CAPTCHA.');
        }
        const captchaInput = page.locator(captchaInputId).first();
        await captchaInput.click({ force: true });
        await captchaInput.fill('');
        await captchaInput.type(captchaValue, { delay: 80 });
        await new Promise((r) => setTimeout(r, 500));
        await page.click('#ctl00_cntContenido_btnVerificarIdentificacion');
        await new Promise((r) => setTimeout(r, 4000));
        let textoResultado = '';
        try {
            const resultado = page.locator('#ctl00_cntContenido_LblResultado');
            await resultado.waitFor({ state: 'visible', timeout: 15000 });
            textoResultado = await resultado.innerText();
        }
        catch {
            textoResultado = await page.evaluate(() => document.body.innerText);
        }
        const resultJson = {
            documento: docNumber,
            tipoDocumento: TIPO_DOC,
            captchaUsado: captchaValue,
            resultado: textoResultado.trim(),
            fecha: new Date().toISOString(),
        };
        fs.writeFileSync(OUTPUT, JSON.stringify(resultJson, null, 2), 'utf-8');
        await page.screenshot({ path: 'resultado_rethus.png', fullPage: true });
        await new Promise((r) => setTimeout(r, 3000));
        const validation = validateRethusResult(textoResultado);
        return buildResponse({
            status: validation.status,
            message: validation.message,
            reason: validation.reason,
            document: docNumber,
            scraping: true,
            data: resultJson,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return buildResponse({
            status: false,
            message: 'No se pudo validar al medico en RETHUS.',
            reason: `No se pudo hacer el web scraping en RETHUS: ${errorMessage}`,
            document: docNumber,
            scraping: false,
            data: null,
        });
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
if (require.main === module) {
    const [documento] = process.argv.slice(2);
    if (!documento) {
        console.error('Uso: node rethus.validator.ts <medico_registro_documento>');
        process.exit(1);
    }
    rethusValidator(documento)
        .then((result) => {
        console.log(JSON.stringify(result, null, 2));
    })
        .catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(errorMessage);
        process.exit(1);
    });
}
module.exports = rethusValidator;
//# sourceMappingURL=rethus.validator.js.map