const fs = require('fs');
const targetPath = './src/environments/environment.production.ts';

const envConfigFile = `export const environment = {
  production: true,
  authUrl: '${process.env.AUTH_URL || ''}',
  authKey: '${process.env.AUTH_KEY || ''}',
  apiUrl: '${process.env.API_URL || ''}',
};
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`✅ Archivo de entorno generado dinámicamente en ${targetPath}`);
});