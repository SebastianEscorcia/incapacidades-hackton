const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── DATOS ─────────────────────────────────────────────
const TIPO_DOC = 'CC';
const OUTPUT   = path.join(__dirname, 'rethus_result.json');
// ───────────────────────────────────────────────────────

function normalizeText(value = '') {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function buildResponse({
    status,
    message,
    reason = null,
    document,
    scraping = true,
    data = null,
}) {
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

async function main(docNumber) {
    console.log('🚀 Iniciando navegador...');
    let browser;

    try {
        browser = await chromium.launch({
            headless: false,
            slowMo: 80,
            args: ['--disable-blink-features=AutomationControlled'],
        });

        const context = await browser.newContext({
            userAgent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        });

        const page = await context.newPage();

        // ─── 1. Abrir página ──────────────────────────────────────────────────
        await page.goto(
            'https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
            { waitUntil: 'domcontentloaded', timeout: 60000 }
        );
        await new Promise(r => setTimeout(r, 1500));

        // ─── 2. Seleccionar tipo documento ────────────────────────────────────
        console.log('📋 Seleccionando tipo documento...');
        await page.waitForSelector('#ctl00_cntContenido_ddlTipoIdentificacion');
        await page.selectOption('#ctl00_cntContenido_ddlTipoIdentificacion', TIPO_DOC);
        await new Promise(r => setTimeout(r, 800));

        // ─── 3. Ingresar número documento ─────────────────────────────────────
        console.log('🔢 Ingresando documento...');
        const inputDoc = page.locator('#ctl00_cntContenido_txtNumeroIdentificacion');
        await inputDoc.waitFor({ state: 'visible', timeout: 15000 });
        await inputDoc.click({ force: true });
        await inputDoc.fill('');
        await inputDoc.type(docNumber, { delay: 100 });
        await new Promise(r => setTimeout(r, 800));

        // ─── 4. Leer CAPTCHA automáticamente desde el src de la imagen ────────
        console.log('🧩 Leyendo CAPTCHA desde URL de imagen...');
        await page.waitForSelector('#imgCaptcha', { state: 'visible', timeout: 20000 });

        // El valor del captcha está en el parámetro pC= del src de la imagen
        // Ejemplo: src="...CaptchaImage.ashx?pC=1129&pGUID=..."
        const captchaValue = await page.evaluate(() => {
            const img = document.querySelector('#imgCaptcha');
            if (!img) return null;
            const src = img.getAttribute('src') || img.src;
            const match = src.match(/[?&]pC=([^&]+)/);
            return match ? match[1] : null;
        });

        if (!captchaValue) {
            throw new Error('No se pudo extraer el valor pC del src de #imgCaptcha');
        }

        console.log(`✅ CAPTCHA leído automáticamente: ${captchaValue}`);

        // ─── 5. Ingresar valor del CAPTCHA ────────────────────────────────────
        // Volcar todos los inputs visibles para diagnóstico
        const allInputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input[type="text"], input:not([type])')).map(el => ({
                id:   el.id,
                name: el.name,
                value: el.value,
                placeholder: el.placeholder,
            }));
        });
        console.log('🔍 Inputs encontrados en la página:', JSON.stringify(allInputs, null, 2));

        // Intentar el input que está justo después del imgCaptcha en el DOM,
        // o cualquier input de texto que no sea el de número de documento
        const captchaInputId = await page.evaluate((numDoc) => {
            // 1. Buscar por proximidad al img captcha
            const img = document.querySelector('#imgCaptcha');
            if (img) {
                // Buscar el siguiente input en el DOM
                let node = img.nextElementSibling;
                while (node) {
                    if (node.tagName === 'INPUT' && (node.type === 'text' || !node.type)) {
                        return '#' + node.id || `[name="${node.name}"]`;
                    }
                    // Buscar dentro del padre
                    const inp = node.querySelector('input[type="text"], input:not([type])');
                    if (inp) return inp.id ? '#' + inp.id : `[name="${inp.name}"]`;
                    node = node.nextElementSibling;
                }
                // Buscar dentro del mismo contenedor padre
                const parent = img.closest('tr, div, td, span');
                if (parent) {
                    const inp = parent.querySelector('input[type="text"], input:not([type])');
                    if (inp) return inp.id ? '#' + inp.id : `[name="${inp.name}"]`;
                }
            }
            // 2. Fallback: cualquier input de texto que no tenga el valor del doc
            const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
            for (const inp of inputs) {
                if (inp.value !== numDoc && !inp.id.toLowerCase().includes('identificacion')) {
                    return inp.id ? '#' + inp.id : `[name="${inp.name}"]`;
                }
            }
            return null;
        }, docNumber);

        console.log(`🎯 Selector detectado para captcha: ${captchaInputId}`);

        if (!captchaInputId) {
            throw new Error('No se pudo hacer el web scraping: no se encontro el campo para ingresar CAPTCHA.');
        }
        const captchaInput = page.locator(captchaInputId).first();
        await captchaInput.click({ force: true });
        await captchaInput.fill('');
        await captchaInput.type(captchaValue, { delay: 80 });
        console.log(`✅ CAPTCHA "${captchaValue}" ingresado en: ${captchaInputId}`);

        await new Promise(r => setTimeout(r, 500));

        // ─── 6. Clic en Verificar ─────────────────────────────────────────────
        console.log('🔍 Haciendo clic en Verificar...');
        await page.click('#ctl00_cntContenido_btnVerificarIdentificacion');
        console.log('✅ Clic enviado.');

        // ─── 7. Esperar resultado (postback ASP.NET) ──────────────────────────
        console.log('⏳ Esperando resultado...');
        await new Promise(r => setTimeout(r, 4000));

        // Intentar leer el resultado
        let textoResultado = '';
        try {
            const resultado = page.locator('#ctl00_cntContenido_LblResultado');
            await resultado.waitFor({ state: 'visible', timeout: 15000 });
            textoResultado = await resultado.innerText();
        } catch (_) {
            // Si no hay label de resultado, tomar todo el texto visible
            textoResultado = await page.evaluate(() => document.body.innerText);
        }

        console.log('\n📄 RESULTADO:\n');
        console.log(textoResultado);

        // ─── 8. Guardar resultado ─────────────────────────────────────────────
        const resultJson = {
            documento: docNumber,
            tipoDocumento: TIPO_DOC,
            captchaUsado: captchaValue,
            resultado: textoResultado.trim(),
            fecha: new Date().toISOString(),
        };

        fs.writeFileSync(OUTPUT, JSON.stringify(resultJson, null, 2), 'utf-8');
        console.log(`\n💾 Guardado: ${OUTPUT}`);

        // ─── 9. Screenshot ────────────────────────────────────────────────────
        await page.screenshot({ path: 'resultado_rethus.png', fullPage: true });
        console.log('📸 Captura guardada: resultado_rethus.png');

        await new Promise(r => setTimeout(r, 3000));

        const validation = validateRethusResult(textoResultado);
        return buildResponse({
            status: validation.status,
            message: validation.message,
            reason: validation.reason,
            document: docNumber,
            scraping: true,
            data: resultJson,
        });

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        return buildResponse({
            status: false,
            message: 'No se pudo validar al medico en RETHUS.',
            reason: `No se pudo hacer el web scraping en RETHUS: ${err.message}`,
            document: docNumber,
            scraping: false,
            data: null,
        });
    } finally {
        if (browser) {
            await browser.close();
            console.log('\n🔌 Navegador cerrado.');
        }
    }
}

module.exports = main;