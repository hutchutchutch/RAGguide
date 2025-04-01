// Debug script to check Vite and server configurations
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check theme.json files
console.log("Checking theme.json files...");
const rootThemePath = path.resolve(__dirname, './theme.json');
const clientThemePath = path.resolve(__dirname, './client/theme.json');
const serverThemePath = path.resolve(__dirname, './server/theme.json');

console.log(`Root theme.json exists: ${fs.existsSync(rootThemePath)}`);
console.log(`Client theme.json exists: ${fs.existsSync(clientThemePath)}`);
console.log(`Server theme.json exists: ${fs.existsSync(serverThemePath)}`);

if (fs.existsSync(rootThemePath)) {
  console.log(`Root theme.json content: ${fs.readFileSync(rootThemePath, 'utf8')}`);
}

// Check vite.config.ts
console.log("\nChecking Vite configuration...");
const clientViteConfigPath = path.resolve(__dirname, './client/vite.config.ts');
const rootViteConfigPath = path.resolve(__dirname, './vite.config.ts');

console.log(`Client vite.config.ts exists: ${fs.existsSync(clientViteConfigPath)}`);
console.log(`Root vite.config.ts exists: ${fs.existsSync(rootViteConfigPath)}`);

// Check client/index.html
console.log("\nChecking client/index.html...");
const clientIndexPath = path.resolve(__dirname, './client/index.html');
console.log(`Client index.html exists: ${fs.existsSync(clientIndexPath)}`);

// Check package.json scripts
console.log("\nChecking package.json scripts...");
const packageJsonPath = path.resolve(__dirname, './package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log("Scripts:", packageJson.scripts);
}

// Check Tailwind config
console.log("\nChecking Tailwind configurations...");
const tailwindConfigPath = path.resolve(__dirname, './tailwind.config.ts');
const clientTailwindConfigPath = path.resolve(__dirname, './client/tailwind.config.ts');

console.log(`Root tailwind.config.ts exists: ${fs.existsSync(tailwindConfigPath)}`);
console.log(`Client tailwind.config.ts exists: ${fs.existsSync(clientTailwindConfigPath)}`);

if (fs.existsSync(clientTailwindConfigPath)) {
  const content = fs.readFileSync(clientTailwindConfigPath, 'utf8');
  console.log(`Client Tailwind config content section: ${content.includes('content:') ? 'Found' : 'Missing'}`);
}

// Check for any logs
console.log("\nChecking for log files...");
const logsDir = path.resolve(__dirname, './logs');
if (fs.existsSync(logsDir)) {
  console.log(`Log files: ${fs.readdirSync(logsDir).join(', ')}`);
} else {
  console.log("No logs directory found");
}

// Check .env files
console.log("\nChecking .env files...");
const envPath = path.resolve(__dirname, './.env');
const envLocalPath = path.resolve(__dirname, './.env.local');

console.log(`.env exists: ${fs.existsSync(envPath)}`);
console.log(`.env.local exists: ${fs.existsSync(envLocalPath)}`);