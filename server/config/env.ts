import dotenv from 'dotenv';
dotenv.config();

/**
 * SkillStudio Backend Environment Configuration
 */

const getEnv = (key: string, defaultValue = ''): string => {
  return process.env[key] || defaultValue;
};

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.error(`CRITICAL ERROR: Environment variable ${key} is missing!`);
    // In production, we might want to throw an error, but in dev we'll just log
    return '';
  }
  return value;
};

export const SERVER_CONFIG = {
  PORT: parseInt(getEnv('PORT', '3000'), 10),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  
  // Security
  JWT_SECRET: getRequiredEnv('JWT_SECRET') || 'fallback-secret-for-dev-only',
  
  // Admin
  ADMIN_USERNAME: getRequiredEnv('ADMIN_USERNAME'),
  ADMIN_PASSWORD: getRequiredEnv('ADMIN_PASSWORD'),
  
  // Google Services (Unified)
  GOOGLE_API_KEY: getRequiredEnv('GOOGLE_API_KEY') || getEnv('VITE_GOOGLE_API_KEY') || getEnv('YOUTUBE_API_KEY'),
  
  // OAuth
  GOOGLE_CLIENT_ID: getEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_REDIRECT_URI: getEnv('GOOGLE_REDIRECT_URI'),
  
  // AI
  GEMINI_API_KEY: getEnv('GEMINI_API_KEY'),
  
  // URLs
  APP_URL: getEnv('APP_URL', 'http://localhost:3000'),
} as const;

export const validateConfig = () => {
  const required = [
    'JWT_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`[CONFIG WARNING] Missing required variables: ${missing.join(', ')}`);
  } else {
    console.log('[CONFIG] All core system variables are valid.');
  }
};
