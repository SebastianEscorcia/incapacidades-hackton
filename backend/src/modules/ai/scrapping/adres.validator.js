const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'eps_data_result.json');
const TARGET_URL  = 'https://www.adres.gov.co/consulte-su-eps';
const FORM_FRAME_URL = 'aplicaciones.adres.gov.co';

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
  expectedEps = null,
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
      epsValidada: expectedEps,
      scrapingExitoso: scraping,
      fuente: 'ADRES',
      fecha: new Date().toISOString(),
      data,
    },
  };
}

function validateAdresResult(result, expectedEps) {
  const affiliationRows = Array.isArray(result?.datosAfiliacion) ? result.datosAfiliacion : [];
  if (!affiliationRows.length) {
    return {
      status: false,
      message: 'No se pudo confirmar la afiliacion del paciente en ADRES.',
      reason: 'No se encontraron registros de afiliacion en la respuesta de ADRES.',
    };
  }

  if (!expectedEps) {
    return {
      status: true,
      message: 'Datos de afiliacion encontrados en ADRES.',
      reason: 'No se envio EPS esperada para validar coincidencia exacta.',
    };
  }

  const expectedNormalized = normalizeText(expectedEps);
  const epsMatch = affiliationRows.some((row) =>
    Object.entries(row || {}).some(([key, value]) => {
      const normalizedKey = normalizeText(key);
      const normalizedValue = normalizeText(value);
      const isEpsField =
        normalizedKey.includes('eps') ||
        normalizedKey.includes('entidad') ||
        normalizedKey.includes('asegurador');
      return (isEpsField && normalizedValue.includes(expectedNormalized)) ||
        normalizedValue.includes(expectedNormalized);
    })
  );

  if (!epsMatch) {
    return {
      status: false,
      message: 'El paciente no pertenece a la EPS indicada.',
      reason: `No hubo coincidencia entre la EPS consultada (${expectedEps}) y los datos de ADRES.`,
    };
  }

  return {
    status: true,
    message: 'Todo esta correcto: el paciente pertenece a la EPS indicada.',
    reason: null,
  };
}

async function getFormFrame(page) {
  for (const frame of page.frames()) {
    if (frame.url().includes(FORM_FRAME_URL)) return frame;
  }
  return null;
}

async function extractData(frameOrPage) {
  return frameOrPage.evaluate(() => {
    const data = {
      informacionBasica: {},
      datosAfiliacion:   [],
      fechaImpresion:    '',
      estacionOrigen:    '',
    };

    document.querySelectorAll('table').forEach((table) => {
      const headers = Array.from(table.querySelectorAll('th')).map(
        th => th.innerText.trim()
      );

      if (headers.length > 0) {
        table.querySelectorAll('tbody tr').forEach((row) => {
          const cells = Array.from(row.querySelectorAll('td')).map(
            td => td.innerText.trim()
          );
          if (cells.length > 0) {
            const entry = {};
            headers.forEach((h, i) => (entry[h] = cells[i] ?? ''));
            data.datosAfiliacion.push(entry);
          }
        });
      } else {
        table.querySelectorAll('tr').forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length === 2) {
            const key = cells[0].innerText.trim();
            const val = cells[1].innerText.trim();
            if (key) data.informacionBasica[key] = val;
          }
        });
      }
    });

    const text = document.body.innerText;
    const fm = text.match(/Fecha de Impresi[oó]n[:\s]+([0-9/\s:.]+)/i);
    if (fm) data.fechaImpresion = fm[1].trim();
    const em = text.match(/Estaci[oó]n de origen[:\s]+([0-9.]+)/i);
    if (em) data.estacionOrigen = em[1].trim();

    return data;
  });
}

async function main(docNumber, expectedEps = null) {
  console.log('🚀 Iniciando navegador...');
  let browser;

  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 60,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 900 },
    });

    const page = await context.newPage();

    // ─── 1. Navegar ────────────────────────────────────────────────────────────
    console.log(`🌐 Cargando: ${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // ─── 2. Localizar iframe del formulario ───────────────────────────────────
    let formFrame = await getFormFrame(page);
    if (!formFrame) throw new Error('Iframe del formulario no encontrado.');
    console.log(`✅ iframe encontrado: ${formFrame.url()}`);

    // ─── 3. Llenar campo de documento ─────────────────────────────────────────
    const inputLoc = formFrame.locator('#txtNumDoc');
    await inputLoc.waitFor({ state: 'visible', timeout: 15000 });
    await inputLoc.click({ force: true });
    await inputLoc.fill('');
    await inputLoc.type(docNumber, { delay: 120 });
    console.log(`✅ Documento escrito: ${docNumber}`);

    // Pausa para que el reCAPTCHA invisible se inicialice completamente
    await page.waitForTimeout(2000);

    // ─── 4. Clic en #btnConsultar ──────────────────────────────────────────────
    // El botón está dentro del iframe, no en la página principal
    const btnLoc = formFrame.locator('#btnConsultar');
    await btnLoc.waitFor({ state: 'visible', timeout: 10000 });

    console.log('🖱️  Haciendo clic en #btnConsultar...');

    // Escuchar nueva pestaña ANTES del clic
    const newPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);

    // Clic que dispara setRecaptchaToken() + WebForm_DoPostBackWithOptions()
    await btnLoc.click({ force: true });
    console.log('✅ Clic enviado.');

    // Segundo clic 1 s después si el botón sigue visible (refuerzo)
    await new Promise(r => setTimeout(r, 1000));
    const stillVisible = await btnLoc.isVisible().catch(() => false);
    if (stillVisible) {
      console.log('🖱️  Segundo clic (refuerzo)...');
      await btnLoc.click({ force: true }).catch(() => {});
    }

    // ─── 5. Detectar reCAPTCHA visual ─────────────────────────────────────────
    await new Promise(r => setTimeout(r, 2500));
    const hasChallenge = page.frames().some(
      f => f.url().includes('recaptcha') && f.url().includes('bframe')
    );
    if (hasChallenge) {
      throw new Error('No se pudo hacer el web scraping: se detecto un desafio visual de reCAPTCHA.');
    } else {
      console.log('✅ Sin desafío visual de reCAPTCHA.');
    }

    // ─── 6. Esperar resultados ─────────────────────────────────────────────────
    const newPage = await newPagePromise;
    let resultContext;

    if (newPage) {
      console.log(`✅ Nueva pestaña detectada: ${newPage.url()}`);
      await newPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
      resultContext = newPage;
    } else {
      // Postback ASP.NET: el iframe se recargó con los resultados
      console.log('⏳ Esperando postback en el iframe (ASP.NET)...');
      await new Promise(r => setTimeout(r, 6000));

      // Volver a buscar el frame (puede tener nueva URL tras el postback)
      formFrame = await getFormFrame(page);
      if (!formFrame) {
        // Intentar en la página principal directamente
        console.log('ℹ️  Buscando resultados en página principal...');
        resultContext = page;
      } else {
        resultContext = formFrame;
      }
    }

    // ─── 7. Extraer datos ─────────────────────────────────────────────────────
    console.log('\n📊 Extrayendo datos...');
    const result = await extractData(resultContext);

    // ─── 8. Guardar JSON ───────────────────────────────────────────────────────
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`\n💾 Guardado en: ${OUTPUT_PATH}`);
    console.log('\n📋 Resultado:');
    console.log(JSON.stringify(result, null, 2));

    const validation = validateAdresResult(result, expectedEps);
    return buildResponse({
      status: validation.status,
      message: validation.message,
      reason: validation.reason,
      document: docNumber,
      expectedEps,
      scraping: true,
      data: result,
    });

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    return buildResponse({
      status: false,
      message: 'No se pudo validar la EPS del paciente.',
      reason: `No se pudo hacer el web scraping en ADRES: ${err.message}`,
      document: docNumber,
      expectedEps,
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