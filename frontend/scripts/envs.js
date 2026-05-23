require('dotenv').config();
const { writeFileSync, mkdirSync } = require('fs');

const devModePath = './src/environments/environment.development.ts';
const prodModePath = './src/environments/environment.ts';

const requiredEnv = ['API_URL', 'IP_URL'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('Missing required environment variables:');
  missingEnv.forEach((key) => console.error(`- ${key}`));
  console.error('Create or update your .env file using .env.template as reference.');
  process.exit(1);
}

const appName = process.env.APP_NAME || 'Frontend';
const tokenKey = process.env.TOKEN || 'TOKEN';
const keyUser = process.env.KEY_USER || 'USER';
const rolKey = process.env.ROL || 'ROL';

const envDevMode = `export const environment = {
  apiUrl: "${process.env.API_URL}",
  ipUrl: "${process.env.IP_URL}",
  app_name: "${appName}",
  TOKEN: "${tokenKey}",
  KEY_USER: "${keyUser}",
  ROL: "${rolKey}",
};
`;

const envProdMode = `export const environment = {
  apiUrl: "${process.env.API_URL}",
  ipUrl: "${process.env.IP_URL}",
  app_name: "${appName}",
  TOKEN: "${tokenKey}",
  KEY_USER: "${keyUser}",
  ROL: "${rolKey}",
};
`;

mkdirSync('./src/environments', { recursive: true });

writeFileSync(devModePath, envDevMode);
writeFileSync(prodModePath, envProdMode);
console.log('Environment files generated.');
