import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidAppId,
  isValidEmail,
  isValidUrl,
  isValidScore,
  isValidGameId,
  isValidDimensions,
  isValidTopic,
  isValidTokenSymbol,
  isValidEnvironment,
  sanitizeString,
  deepClone,
  retryWithBackoff,
  debounce,
  throttle,
} from '../src/utils/validators';

describe('Validators', () => {
  describe('isValidAppId', () => {
    it('should validate correct app IDs', () => {
      expect(isValidAppId('miniapp_abc123')).toBe(true);
      expect(isValidAppId('miniapp_my-app')).toBe(true);
      expect(isValidAppId('miniapp_test_123')).toBe(true);
    });

    it('should reject invalid app IDs', () => {
      expect(isValidAppId('')).toBe(false);
      expect(isValidAppId('invalid')).toBe(false);
      expect(isValidAppId('miniapp')).toBe(false);
      expect(isValidAppId('app_123')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });
  });

  describe('isValidScore', () => {
    it('should validate correct scores', () => {
      expect(isValidScore(0)).toBe(true);
      expect(isValidScore(100)).toBe(true);
      expect(isValidScore(999999999)).toBe(true);
    });

    it('should reject invalid scores', () => {
      expect(isValidScore(-1)).toBe(false);
      expect(isValidScore('100')).toBe(false);
      expect(isValidScore(NaN)).toBe(false);
      expect(isValidScore(Infinity)).toBe(false);
    });
  });

  describe('isValidDimensions', () => {
    it('should validate correct dimensions', () => {
      expect(isValidDimensions({ width: 100 })).toBe(true);
      expect(isValidDimensions({ height: '100px' })).toBe(true);
      expect(isValidDimensions({ width: 100, height: '50%' })).toBe(true);
    });

    it('should reject invalid dimensions', () => {
      expect(isValidDimensions({ width: -100 })).toBe(false);
      expect(isValidDimensions({ width: 'invalid' })).toBe(false);
    });
  });

  describe('isValidTopic', () => {
    it('should validate correct topics', () => {
      expect(isValidTopic('leaderboard')).toBe(true);
      expect(isValidTopic('leaderboard.updates')).toBe(true);
      expect(isValidTopic('wallet.transactions')).toBe(true);
    });

    it('should reject invalid topics', () => {
      expect(isValidTopic('')).toBe(false);
      expect(isValidTopic('Leaderboard')).toBe(false);
      expect(isValidTopic('leaderboard updates')).toBe(false);
    });
  });

  describe('isValidEnvironment', () => {
    it('should validate correct environments', () => {
      expect(isValidEnvironment('development')).toBe(true);
      expect(isValidEnvironment('staging')).toBe(true);
      expect(isValidEnvironment('production')).toBe(true);
    });

    it('should reject invalid environments', () => {
      expect(isValidEnvironment('')).toBe(false);
      expect(isValidEnvironment('test')).toBe(false);
      expect(isValidEnvironment('dev')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize HTML characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(123 as any)).toBe('');
    });
  });

  describe('deepClone', () => {
    it('should deeply clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should handle arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should handle dates', () => {
      const date = new Date();
      const cloned = deepClone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
  });

  describe('retryWithBackoff', () => {
    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));
      await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);
      
      debounced(1);
      debounced(2);
      debounced(3);
      
      expect(fn).not.toHaveBeenCalled();
      
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 50);
      
      throttled(1);
      throttled(2);
      throttled(3);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(1);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      throttled(4);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
