import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = path.join(__dirname, 'eps_data_result.json');
const TARGET_URL = 'https://www.adres.gov.co/consulte-su-eps';
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
}: {
  status: boolean;
  message: string;
  reason?: string | null;
  document: string;
  expectedEps?: string | null;
  scraping?: boolean;
  data?: unknown;
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

function validateAdresResult(result: any, expectedEps?: string | null) {
  const affiliationRows = Array.isArray(result?.datosAfiliacion)
    ? result.datosAfiliacion
    : [];
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
  const epsMatch = affiliationRows.some((row: Record<string, unknown>) =>
    Object.entries(row || {}).some(([key, value]) => {
      const normalizedKey = normalizeText(key);
      const normalizedValue = normalizeText(value as any);
      const isEpsField =
        normalizedKey.includes('eps') ||
        normalizedKey.includes('entidad') ||
        normalizedKey.includes('asegurador');
      return (
        (isEpsField && normalizedValue.includes(expectedNormalized)) ||
        normalizedValue.includes(expectedNormalized)
      );
    }),
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

async function getFormFrame(page: any) {
  for (const frame of page.frames()) {
    if (frame.url().includes(FORM_FRAME_URL)) return frame;
  }
  return null;
}

async function extractData(frameOrPage: any) {
  return frameOrPage.evaluate(() => {
    const data = {
      informacionBasica: {} as Record<string, string>,
      datosAfiliacion: [] as Record<string, string>[],
      fechaImpresion: '',
      estacionOrigen: '',
    };

    document.querySelectorAll('table').forEach((table) => {
      const headers = Array.from(table.querySelectorAll('th')).map((th) =>
        th.innerText.trim(),
      );

      if (headers.length > 0) {
        table.querySelectorAll('tbody tr').forEach((row) => {
          const cells = Array.from(row.querySelectorAll('td')).map((td) =>
            td.innerText.trim(),
          );
          if (cells.length > 0) {
            const entry: Record<string, string> = {};
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
            if (key) {
              (data.informacionBasica as Record<string, string>)[key] = val;
            }
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

async function adresValidator(docNumber: string, expectedEps: string | null = null) {
  console.log('Iniciando navegador...');
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
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    let formFrame = await getFormFrame(page);
    if (!formFrame) throw new Error('Iframe del formulario no encontrado.');

    const inputLoc = formFrame.locator('#txtNumDoc');
    await inputLoc.waitFor({ state: 'visible', timeout: 15000 });
    await inputLoc.click({ force: true });
    await inputLoc.fill('');
    await inputLoc.type(docNumber, { delay: 120 });
    await page.waitForTimeout(2000);

    const btnLoc = formFrame.locator('#btnConsultar');
    await btnLoc.waitFor({ state: 'visible', timeout: 10000 });
    const newPagePromise = context
      .waitForEvent('page', { timeout: 15000 })
      .catch(() => null);
    await btnLoc.click({ force: true });

    await new Promise((r) => setTimeout(r, 1000));
    const stillVisible = await btnLoc.isVisible().catch(() => false);
    if (stillVisible) {
      await btnLoc.click({ force: true }).catch(() => undefined);
    }

    await new Promise((r) => setTimeout(r, 2500));
    const hasChallenge = page
      .frames()
      .some((f: any) => f.url().includes('recaptcha') && f.url().includes('bframe'));
    if (hasChallenge) {
      throw new Error(
        'No se pudo hacer el web scraping: se detecto un desafio visual de reCAPTCHA.',
      );
    }

    const newPage = await newPagePromise;
    let resultContext;

    if (newPage) {
      await newPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      resultContext = newPage;
    } else {
      await new Promise((r) => setTimeout(r, 6000));
      formFrame = await getFormFrame(page);
      if (!formFrame) {
        resultContext = page;
      } else {
        resultContext = formFrame;
      }
    }

    const result = await extractData(resultContext);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');

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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return buildResponse({
      status: false,
      message: 'No se pudo validar la EPS del paciente.',
      reason: `No se pudo hacer el web scraping en ADRES: ${errorMessage}`,
      document: docNumber,
      expectedEps,
      scraping: false,
      data: null,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default adresValidator;
