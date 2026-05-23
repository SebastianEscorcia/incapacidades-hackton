const { existsSync, readFileSync } = require('fs');

const requiredFiles = [
  'src/app/app.ts',
  'src/app/app.config.ts',
  'src/app/app.routes.ts',
  'src/app/modules/modules.routes.ts',
  'src/assets/styles.scss',
  'src/assets/tailwind.css',
  'scripts/envs.js',
  '.env.template',
];

const requiredDependencies = [
  '@primeuix/themes',
  'primeng',
  'primeicons',
  'tailwindcss',
  '@tailwindcss/postcss',
  'tailwindcss-primeui',
  'dotenv',
];

let hasError = false;

function fail(message) {
  hasError = true;
  console.error(`[fail] ${message}`);
}

function pass(message) {
  console.log(`[ok] ${message}`);
}

requiredFiles.forEach((filePath) => {
  if (existsSync(filePath)) {
    pass(`Found ${filePath}`);
  } else {
    fail(`Missing ${filePath}`);
  }
});

if (!existsSync('package.json')) {
  fail('Missing package.json');
} else {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  requiredDependencies.forEach((dependency) => {
    if (dependencies[dependency]) {
      pass(`Dependency configured: ${dependency}`);
    } else {
      fail(`Dependency missing: ${dependency}`);
    }
  });
}

if (!existsSync('.env')) {
  fail('Missing .env file. Create it from .env.template.');
}

if (hasError) {
  console.error('KEONAI TEMPLATE health check failed.');
  process.exit(1);
}

console.log('KEONAI TEMPLATE health check passed.');
