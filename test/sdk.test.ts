import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCricapSDK } from '../src/index';

describe('CricapSDK', () => {
  const validConfig = {
    appId: 'miniapp_test123',
    environment: 'development' as const,
    version: '1.0.0',
    debug: false,
  };

  beforeEach(() => {
    // Mock window.parent.postMessage
    Object.defineProperty(window, 'parent', {
      value: {
        postMessage: vi.fn(),
      },
      writable: true,
    });

    // Mock window.addEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create SDK instance with valid config', () => {
      const sdk = initCricapSDK(validConfig);
      expect(sdk).toBeDefined();
      expect(sdk.config.appId).toBe(validConfig.appId);
      expect(sdk.config.environment).toBe(validConfig.environment);
    });

    it('should throw if appId is missing', () => {
      expect(() => initCricapSDK({
        ...validConfig,
        appId: '',
      })).toThrow('appId is required');
    });

    it('should throw if appId is invalid', () => {
      expect(() => initCricapSDK({
        ...validConfig,
        appId: 'invalid-app-id',
      })).toThrow('Invalid appId format');
    });

    it('should throw if environment is invalid', () => {
      expect(() => initCricapSDK({
        ...validConfig,
        environment: 'invalid' as any,
      })).toThrow('environment must be');
    });

    it('should set default values', () => {
      const sdk = initCricapSDK({
        appId: 'miniapp_test123',
        environment: 'development',
      });
      expect(sdk.config.version).toBe('1.0.0');
      expect(sdk.config.debug).toBe(false);
      expect(sdk.config.timeout).toBe(30000);
    });
  });

  describe('modules', () => {
    it('should expose all modules', () => {
      const sdk = initCricapSDK(validConfig);
      
      expect(sdk.auth).toBeDefined();
      expect(sdk.user).toBeDefined();
      expect(sdk.platform).toBeDefined();
      expect(sdk.ui).toBeDefined();
      expect(sdk.notifications).toBeDefined();
      expect(sdk.events).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const sdk = initCricapSDK(validConfig);
      expect(() => sdk.destroy()).not.toThrow();
    });
  });
});
