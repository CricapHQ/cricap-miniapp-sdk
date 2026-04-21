/**
 * Cricap Mini App SDK
 * 
 * Official TypeScript SDK for the Cricap Mini App Ecosystem
 * @version 1.0.0
 * @license MIT
 */

// Core components
export { ContainerBridge } from './core/ContainerBridge';
export { CricapEventEmitter } from './core/EventEmitter';
export { MessageHandler } from './core/MessageHandler';

// Module implementations
export { AuthModuleImpl } from './modules/AuthModule';
export { UserModuleImpl } from './modules/UserModule';
export { PlatformModuleImpl } from './modules/PlatformModule';
export { UIModuleImpl } from './modules/UIModule';
export { NotificationModuleImpl } from './modules/NotificationModule';

// Utilities
export * from './utils/validators';

// Type exports
export * from './types';

// Import types needed for implementation
import type { 
  CricapSDKConfig, 
  SDKInstance, 
  InitResult,
  AuthModule,
  UserModule,
  PlatformModule,
  UIModule,
  NotificationModule,
  EventEmitter,
} from './types';

import { ContainerBridge } from './core/ContainerBridge';
import { CricapEventEmitter } from './core/EventEmitter';
import { AuthModuleImpl } from './modules/AuthModule';
import { UserModuleImpl } from './modules/UserModule';
import { PlatformModuleImpl } from './modules/PlatformModule';
import { UIModuleImpl } from './modules/UIModule';
import { NotificationModuleImpl } from './modules/NotificationModule';
import { isValidAppId, isValidEnvironment } from './utils/validators';

/**
 * CricapSDK class - Main SDK implementation
 */
class CricapSDK implements SDKInstance {
  public config: CricapSDKConfig;
  public auth: AuthModule;
  public user: UserModule;
  public platform: PlatformModule;
  public ui: UIModule;
  public notifications: NotificationModule;
  public events: EventEmitter;

  private containerBridge: ContainerBridge;
  private notificationModule: NotificationModuleImpl;

  constructor(config: CricapSDKConfig) {
    // Validate required config
    if (!config.appId) {
      throw new Error('CricapSDK: appId is required');
    }
    if (!isValidAppId(config.appId)) {
      throw new Error('CricapSDK: Invalid appId format. Expected: miniapp_xxx');
    }
    if (!config.environment || !isValidEnvironment(config.environment)) {
      throw new Error('CricapSDK: environment must be "development", "staging", or "production"');
    }

    // Set defaults
    this.config = {
      version: '1.0.0',
      debug: false,
      timeout: 30000,
      ...config,
    };

    // Initialize container bridge
    this.containerBridge = new ContainerBridge(this.config);

    // Get message handler from bridge
    const messageHandler = this.containerBridge.getMessageHandler();

    // Initialize modules
    this.auth = new AuthModuleImpl(messageHandler, this.config);
    this.user = new UserModuleImpl(messageHandler, this.config);
    this.platform = new PlatformModuleImpl(messageHandler, this.config);
    this.ui = new UIModuleImpl(messageHandler, this.config);
    this.notificationModule = new NotificationModuleImpl(messageHandler, this.config);
    this.notifications = this.notificationModule;

    // Get event emitter from bridge
    this.events = this.containerBridge.getEventEmitter();

    // Log initialization in debug mode
    if (this.config.debug) {
      console.log('[CricapSDK] Instance created', {
        appId: this.config.appId,
        environment: this.config.environment,
        version: this.config.version,
      });
    }
  }

  /**
   * Initialize the SDK and establish connection with the container
   */
  public async initialize(): Promise<InitResult> {
    if (this.config.debug) {
      console.log('[CricapSDK] Initializing...');
    }

    const result = await this.containerBridge.initialize();

    if (result.success && this.config.debug) {
      console.log('[CricapSDK] Initialized successfully');
    }

    return result;
  }

  /**
   * Destroy the SDK instance and clean up resources
   */
  public destroy(): void {
    if (this.config.debug) {
      console.log('[CricapSDK] Destroying...');
    }

    this.notificationModule.destroy();
    this.containerBridge.destroy();

    if (this.config.debug) {
      console.log('[CricapSDK] Destroyed');
    }
  }
}

/**
 * Initialize the Cricap Mini App SDK
 * 
 * @example
 * ```typescript
 * import { initCricapSDK } from '@cricap/miniapp-sdk';
 * 
 * const sdk = initCricapSDK({
 *   appId: 'miniapp_your_app_id',
 *   environment: 'production',
 *   version: '1.0.0',
 *   debug: true,
 * });
 * 
 * const result = await sdk.initialize();
 * if (result.success) {
 *   console.log('SDK ready!');
 * }
 * ```
 */
export function initCricapSDK(config: CricapSDKConfig): SDKInstance {
  return new CricapSDK(config);
}

// Default export
export default {
  initCricapSDK,
  ContainerBridge,
  CricapEventEmitter,
  MessageHandler,
  AuthModuleImpl,
  UserModuleImpl,
  PlatformModuleImpl,
  UIModuleImpl,
  NotificationModuleImpl,
};
