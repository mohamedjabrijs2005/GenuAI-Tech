const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Starting GenuAI Vercel Monorepo Build ---');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');

try {
  console.log('1. Installing frontend dependencies...');
  execSync('npm install --prefix frontend --include=dev', { stdio: 'inherit', cwd: rootDir });

  console.log('2. Building Next.js application...');
  execSync('npm run build --prefix frontend', { stdio: 'inherit', cwd: rootDir });

  // Copy build output to root if built from root
  const srcNext = path.join(frontendDir, '.next');
  const destNext = path.join(rootDir, '.next');
  const srcPublic = path.join(frontendDir, 'public');
  const destPublic = path.join(rootDir, 'public');

  if (fs.existsSync(srcNext)) {
    console.log('3. Copying frontend/.next to ./.next for Vercel...');
    fs.cpSync(srcNext, destNext, { recursive: true });
  }

  if (fs.existsSync(srcPublic)) {
    console.log('4. Copying frontend/public to ./public for Vercel...');
    fs.cpSync(srcPublic, destPublic, { recursive: true });
  }

  console.log('--- GenuAI Build Complete for Vercel ---');
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}
