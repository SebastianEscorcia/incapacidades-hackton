const { firefox } = require('playwright');

// ─── CREDENCIALES Y DATOS POR DEFECTO ────────────────────────────────────────
const DEFAULT_TIPO_ID = 'C'; // C = CEDULA
const DEFAULT_NUM_ID = '1065872824';
const DEFAULT_PASSWORD = '1065';
const DEFAULT_NIT = '901240743';
// ─────────────────────────────────────────────────────────────────────────────

type LoginConfig = {
  tipoId: string;
  numId: string;
  password: string;
  nit: string;
};

type CliCredentials = {
  usuario?: string;
  password?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function parseCliCredentials(args: string[]): CliCredentials {
  const parsed: CliCredentials = {};
  const positionals: string[] = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg.startsWith('--usuario=')) {
      parsed.usuario = arg.split('=').slice(1).join('=');
      continue;
    }
    if (arg === '--usuario' && args[i + 1]) {
      parsed.usuario = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--pass=')) {
      parsed.password = arg.split('=').slice(1).join('=');
      continue;
    }
    if (arg === '--pass' && args[i + 1]) {
      parsed.password = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--password=')) {
      parsed.password = arg.split('=').slice(1).join('=');
      continue;
    }
    if (arg === '--password' && args[i + 1]) {
      parsed.password = args[i + 1];
      i += 1;
      continue;
    }

    if (!arg.startsWith('--')) {
      positionals.push(arg);
    }
  }

  // Soporta: ts-node incapacidad.ts <usuario> <pass>
  if (!parsed.usuario && positionals[0]) parsed.usuario = positionals[0];
  if (!parsed.password && positionals[1]) parsed.password = positionals[1];

  return parsed;
}

async function clickVirtualKeyboard(page: any, password: string): Promise<void> {
  console.log('⌨️  Ingresando contraseña en teclado virtual...');

  await page.waitForSelector('.ui-keyboard-keyset-default', { state: 'visible', timeout: 10000 });

  for (const digit of password) {
    const selector = `.ui-keyboard-keyset-default button[data-value="${digit}"]`;
    await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });

    try {
      await page.click(selector, { timeout: 3000 });
      console.log(`   → dígito (nativo): ${digit}`);
    } catch (_error) {
      console.log(`   ⚠️ Clic nativo falló para dígito ${digit}, intentando dispatchEvent...`);
      const clicked = await page.evaluate((d: string) => {
        const btn = document.querySelector(`.ui-keyboard-keyset-default button[data-value="${d}"]`);
        if (!btn) return false;
        btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return true;
      }, digit);

      if (clicked) {
        console.log(`   → dígito (eval): ${digit}`);
      } else {
        console.log(`   ⚠️ No se encontró botón para: ${digit}`);
      }
    }
    await page.waitForTimeout(500);
  }

  // Clic en Aceptar ✔
  const acceptSelector = '.ui-keyboard-accept';
  await page.waitForSelector(acceptSelector, { state: 'visible', timeout: 5000 });
  try {
    await page.click(acceptSelector, { timeout: 3000 });
    console.log('   → ✔ Aceptar presionado (nativo)');
  } catch (_error) {
    console.log('   ⚠️ Clic nativo falló para Aceptar, intentando dispatchEvent...');
    const accepted = await page.evaluate(() => {
      const btn = document.querySelector('.ui-keyboard-accept');
      if (!btn) return false;
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    });

    if (accepted) {
      console.log('   → ✔ Aceptar presionado (eval)');
    } else {
      console.log('   ⚠️ No se encontró botón Aceptar');
    }
  }

  // Esperar a que el teclado virtual se cierre (desaparezca del DOM visible)
  console.log('⏳ Esperando que el teclado virtual se cierre...');
  await page.waitForSelector('.ui-keyboard', { state: 'hidden', timeout: 10000 }).catch(() => {
    console.log('   ⚠️ El teclado no se ocultó automáticamente, continuando...');
  });
  await page.waitForTimeout(800);
}

async function main(overrides: CliCredentials = {}): Promise<void> {
  const config: LoginConfig = {
    tipoId: DEFAULT_TIPO_ID,
    numId: overrides.usuario ?? DEFAULT_NUM_ID,
    password: overrides.password ?? DEFAULT_PASSWORD,
    nit: DEFAULT_NIT,
  };

  console.log('🚀 Iniciando navegador (Firefox)...');
  const browser = await firefox.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ── 1. Ir al portal de Empresas directamente ─────────────────────────────
    console.log('🌐 Cargando portal Sura Empresas...');
    await page.goto('https://epsapps.suramericana.com/Semp/faces/empleadores/login/loginEmpresas.jspx', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // ── 2. Tipo de identificación ──────────────────────────────────────────────
    console.log('📋 Seleccionando tipo de identificación: CEDULA');
    await page.waitForSelector('#ctl00_ContentMain_suraType', { state: 'visible' });
    await page.selectOption('#ctl00_ContentMain_suraType', config.tipoId);
    await page.waitForTimeout(300);

    // ── 3. Número de identificación ───────────────────────────────────────────
    console.log('🔢 Ingresando número de identificación...');
    await page.waitForSelector('#suraName', { state: 'visible' });
    await page.fill('#suraName', config.numId);
    await page.waitForTimeout(300);

    // ── 4. Abrir teclado virtual ───────────────────────────────────────────────
    console.log('🔑 Abriendo teclado virtual de contraseña...');
    await page.waitForSelector('[name="suraPassword"]', { state: 'visible' });
    await page.click('[name="suraPassword"]', { force: true });
    await page.waitForTimeout(1000);

    // ── 5. Ingresar contraseña ─────────────────────────────────────────────────
    await clickVirtualKeyboard(page, config.password);

    // ── 6. Clic en Iniciar sesión ─────────────────────────────────────────────
    console.log('🔐 Iniciando sesión (Paso 1)...');
    await page.evaluate(() => {
      const btn = document.querySelector('#session-internet') as HTMLElement | null;
      if (btn) btn.click();
    });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('✅ Primer paso de autenticación completado.');

    // ── 7. NIT de Empresa (Aparece en el Paso 2) ──────────────────────────────
    console.log('⏳ Esperando campo NIT (loginEmpresas:dniEmpresa)...');
    const nitInput = page.locator('[id="loginEmpresas:dniEmpresa"]');
    await nitInput.waitFor({ state: 'visible', timeout: 30000 });
    console.log(`🔢 Ingresando NIT: ${config.nit}...`);
    await nitInput.fill(config.nit);
    await page.waitForTimeout(300);
    // ── 7b. Clic en botón ACEPTAR (id="loginEmpresas:generar") ───────────────
    console.log('⏳ Presionando botón ACEPTAR (loginEmpresas:generar)...');
    // El <a> tiene id con dos puntos, hay que escaparlo o usar [id="..."]
    const aceptarBtn = page.locator('[id="loginEmpresas:generar"]');
    await aceptarBtn.waitFor({ state: 'visible', timeout: 10000 });
    try {
      await aceptarBtn.click();
      console.log('✅ Botón ACEPTAR presionado (nativo).');
    } catch (_error) {
      // Fallback: disparar el onclick JSF directamente
      console.log('   ⚠️ Clic nativo falló, disparando onclick JSF...');
      await page.evaluate(() => {
        const el = document.querySelector('[id="loginEmpresas:generar"]') as HTMLElement | null;
        if (el) el.click();
      });
      console.log('✅ Botón ACEPTAR presionado (evaluate).');
    }
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('✅ Segundo paso de NIT completado.');

    // ── 8. Clic en "Radicar Incapacidades" ────────────────────────────────────
    console.log('📄 Buscando enlace "Radicar Incapacidades"...');
    // El enlace: <a href="../../../faces/pos/radicarIncapacidad/parametros.jspx"
    //              idpadre="MenuSemp" target="contenido"
    //              onclick="javascript:hideMenuColumn('MenuSemp');">Radicar Incapacidades</a>
    const radSelectors = [
      'a[href*="parametros.jspx"][href*="radicarIncapacidad"]',
      'a[href*="radicarIncapacidad"]',
      'a[href*="parametros.jspx"]',
    ];

    let clickedRad = false;

    // Polling: esperar hasta 20 s a que el menú cargue
    const radDeadline = Date.now() + 20000;
    while (!clickedRad && Date.now() < radDeadline) {
      const allCtx = [page, ...page.frames()];
      for (const ctx of allCtx) {
        // Intentar con selectores CSS
        for (const sel of radSelectors) {
          try {
            const el = ctx.locator(sel).first();
            await el.waitFor({ state: 'visible', timeout: 1000 });
            await el.click();
            clickedRad = true;
            console.log(`✅ "Radicar Incapacidades" cliqueado (selector: ${sel})`);
            break;
          } catch (_) {
            /* siguiente */
          }
        }
        if (clickedRad) break;

        // Fallback: buscar por texto exacto en el frame via evaluate y disparar click
        try {
          const found = await ctx.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            const a = anchors.find(
              (el) =>
                el.textContent?.trim() === 'Radicar Incapacidades' ||
                (el.href && el.href.includes('radicarIncapacidad')),
            ) as HTMLAnchorElement | undefined;

            if (a) {
              a.click();
              return true;
            }
            return false;
          });
          if (found) {
            clickedRad = true;
            console.log(
              `✅ "Radicar Incapacidades" cliqueado via evaluate en frame: ${ctx.url().substring(0, 60)}`,
            );
            break;
          }
        } catch (_) {
          /* siguiente frame */
        }
      }

      if (!clickedRad) {
        console.log('   ⏳ Menú aún no visible, reintentando...');
        await page.waitForTimeout(1000);
      }
    }

    if (!clickedRad) {
      throw new Error('No se encontró el enlace "Radicar Incapacidades" después de 20 s.');
    }

    // Esperar a que el iframe "contenido" cargue el formulario
    console.log('⏳ Esperando formulario de Radicar Incapacidades en iframe "contenido"...');
    await page.waitForTimeout(3000);

    // ── 9. Llenar campos en el iframe "contenido" ──────────────────────────────
    // El formulario carga en <iframe name="contenido"> o target="contenido"
    let contenidoFrame = page.frames().find((f: any) => f.name() === 'contenido') || null;

    // Si no encontramos por nombre, buscar por URL parcial
    if (!contenidoFrame) {
      contenidoFrame = page.frames().find((f: any) => f.url().includes('radicarIncapacidad')) || null;
    }

    // Si aún no, buscar en todos los frames
    if (!contenidoFrame) {
      for (const f of page.frames()) {
        try {
          const el = f.locator('[id="radicarIncapacidad:tipoIncapacidad"]').first();
          await el.waitFor({ state: 'visible', timeout: 2000 });
          contenidoFrame = f;
          break;
        } catch (_) {
          /* siguiente */
        }
      }
    }

    if (!contenidoFrame) {
      throw new Error('No se encontró el iframe con el formulario radicarIncapacidad.');
    }
    console.log(`🖼️  Iframe del formulario encontrado: ${contenidoFrame.url().substring(0, 80)}`);

    // Campo: Tipo de Incapacidad → "0"
    console.log('📝 Ingresando Tipo de Incapacidad: 0...');
    const tipoInput = contenidoFrame.locator('[id="radicarIncapacidad:tipoIncapacidad"]');
    await tipoInput.waitFor({ state: 'visible', timeout: 10000 });
    await tipoInput.click();
    await tipoInput.fill('0');
    await page.waitForTimeout(400);

    // Campo: Número de Incapacidad → "42120165"
    console.log('📝 Ingresando Número de Incapacidad: 42120165...');
    const numInput = contenidoFrame.locator('[id="radicarIncapacidad:numeroIncapacidad"]');
    await numInput.waitFor({ state: 'visible', timeout: 10000 });
    await numInput.click();
    await numInput.fill('42120165');
    await page.waitForTimeout(400);
    console.log('✅ Campos de incapacidad completados.');

    // ── 10. Clic en botón "Radicar" (id="radicarIncapacidad:radicar") ──────────
    console.log('🚀 Presionando botón "Radicar"...');
    // Igual que el ACEPTAR: ID con dos puntos → usar [id="..."]
    const radicarBtn = contenidoFrame.locator('[id="radicarIncapacidad:radicar"]');
    await radicarBtn.waitFor({ state: 'visible', timeout: 10000 });
    try {
      await radicarBtn.click();
      console.log('✅ Botón "Radicar" presionado (nativo).');
    } catch (_error) {
      // Fallback: disparar onclick JSF directamente
      console.log('   ⚠️ Clic nativo falló, disparando onclick JSF...');
      await contenidoFrame.evaluate(() => {
        const el = document.querySelector('[id="radicarIncapacidad:radicar"]') as HTMLElement | null;
        if (el) el.click();
      });
      console.log('✅ Botón "Radicar" presionado (evaluate).');
    }
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('🎉 ¡Proceso completado exitosamente!');
    await page.screenshot({ path: 'evidencia.png' });
    console.log('📸 Captura final guardada en evidencia.png');
  } catch (error: unknown) {
    console.error('❌ Error durante la ejecución:', getErrorMessage(error));
    try {
      await page.screenshot({ path: 'evidencia.png' });
      console.log('📸 Captura de error guardada en evidencia.png');
    } catch (screenshotError: unknown) {
      console.error('⚠️ No se pudo guardar la captura de error:', getErrorMessage(screenshotError));
    }
    process.exit(1);
  } finally {
    // Mantener el navegador abierto unos segundos para ver el resultado
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

const cliCredentials = parseCliCredentials(process.argv.slice(2));

main(cliCredentials).catch((error: unknown) => {
  console.error('❌ Error fatal:', getErrorMessage(error));
  process.exit(1);
});
