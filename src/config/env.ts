/**
 * SkillStudio Frontend Environment Configuration
 * Centralized access point for all environment variables.
 */

// Utility to ensure required environment variables are present
const getEnv = (key: string, required = true): string => {
  const value = import.meta.env[key];
  if (required && !value) {
    console.warn(`Environment variable ${key} is missing!`);
  }
  return value || '';
};

export const ENV = {
  // Mode
  IS_PROD: import.meta.env.PROD,
  IS_DEV: import.meta.env.DEV,

  // Google Services
  GOOGLE_API_KEY: getEnv('VITE_GOOGLE_API_KEY') || getEnv('VITE_YOUTUBE_API_KEY') || getEnv('VITE_GOOGLE_DRIVE_API_KEY'),

  // AI
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : ''),

  // Metadata
  APP_NAME: 'SkillStudio',
} as const;

// Combined key validation
export const isConfigured = {
  google: !!ENV.GOOGLE_API_KEY,
  ai: !!ENV.GEMINI_API_KEY,
};
