import dotenv from 'dotenv';

dotenv.config();

const env = process.env;
const isDev = env.NODE_ENV === 'development';
const flag = (v: string | undefined, def: boolean) => (v === undefined || v === '' ? def : v === 'true' || v === '1');

const WEAK_SECRETS = new Set(['', 'your-super-secret-jwt-key-change-in-production', 'dev-only-secret-change-me', 'changeme', 'secret']);

function jwtSecret() {
  const s = env.JWT_SECRET || '';
  if (!isDev && (WEAK_SECRETS.has(s) || s.length < 32))
    throw new Error('JWT_SECRET doit contenir au moins 32 caractères aléatoires hors développement (ex. `openssl rand -hex 32`).');
  return s || 'dev-only-secret-change-me';
}

export const config = {
  isDev,
  port: Number(env.PORT || 3001),
  frontendUrl: env.FRONTEND_URL || 'http://localhost:3000',
  jwtSecret: jwtSecret(),
  sessionDays: 7,
  cookieSecure: !isDev,
  cookieDomain: env.COOKIE_DOMAIN || undefined,
  trustProxy: env.TRUST_PROXY ? (/^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY) : false,
  devResetLink: isDev && flag(env.DEV_RESET_LINK, true),
  simulatedPayments: flag(env.SIMULATED_PAYMENTS, isDev),
};

if (!isDev && config.frontendUrl.startsWith('http://') && !config.frontendUrl.includes('localhost'))
  throw new Error('FRONTEND_URL doit être en https hors développement.');
