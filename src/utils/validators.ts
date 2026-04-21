/**
 * Validation utilities for the Cricap Mini App SDK
 */

/**
 * Validate a mini app ID format
 * Expected format: miniapp_[alphanumeric]
 */
export function isValidAppId(appId: string): boolean {
  if (typeof appId !== 'string') return false;
  return /^miniapp_[a-zA-Z0-9_-]+$/.test(appId);
}

/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a URL
 */
export function isValidUrl(url: string): boolean {
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a score value
 */
export function isValidScore(score: unknown): score is number {
  return typeof score === 'number' && 
         !isNaN(score) && 
         isFinite(score) && 
         score >= 0 &&
         score <= 999999999;
}

/**
 * Validate a game ID
 */
export function isValidGameId(gameId: string): boolean {
  if (typeof gameId !== 'string') return false;
  return gameId.length > 0 && gameId.length <= 100;
}

/**
 * Validate dimensions object
 */
export function isValidDimensions(dimensions: unknown): boolean {
  if (typeof dimensions !== 'object' || dimensions === null) return false;
  
  const validKeys = ['width', 'height', 'maxWidth', 'maxHeight'];
  const dims = dimensions as Record<string, unknown>;
  
  for (const key of validKeys) {
    const value = dims[key];
    if (value !== undefined) {
      if (typeof value === 'number') {
        if (value < 0) return false;
      } else if (typeof value === 'string') {
        if (!/^\d+(px|%|vh|vw|rem|em)$/.test(value) && value !== 'auto') {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Validate a notification topic
 */
export function isValidTopic(topic: string): boolean {
  if (typeof topic !== 'string') return false;
  // Topics should be lowercase with dots as separators
  return /^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/.test(topic);
}

/**
 * Validate a token symbol
 */
export function isValidTokenSymbol(symbol: string): boolean {
  if (typeof symbol !== 'string') return false;
  return /^[A-Z0-9]{2,10}$/.test(symbol);
}

/**
 * Validate pagination options
 */
export function isValidPaginationOptions(options: { limit?: number; cursor?: string }): boolean {
  if (options.limit !== undefined) {
    if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 1000) {
      return false;
    }
  }
  if (options.cursor !== undefined && typeof options.cursor !== 'string') {
    return false;
  }
  return true;
}

/**
 * Sanitize a string to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;');
}

/**
 * Validate environment value
 */
export function isValidEnvironment(env: string): env is 'development' | 'staging' | 'production' {
  return ['development', 'staging', 'production'].includes(env);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        30000 // Max 30 seconds
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
