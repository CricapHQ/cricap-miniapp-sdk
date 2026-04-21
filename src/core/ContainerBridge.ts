import { MessageHandler } from './MessageHandler';
import { CricapEventEmitter } from './EventEmitter';
import type { 
  CricapSDKConfig, 
  SessionInfo,
  InitResult,
  SDKError,
  CricapMessage,
  AuthState
} from '../types';

/**
 * ContainerBridge manages the connection between the mini app and the Cricap container.
 * It handles initialization, authentication, and lifecycle events.
 */
export class ContainerBridge {
  private messageHandler: MessageHandler;
  private eventEmitter: CricapEventEmitter;
  private config: CricapSDKConfig;
  private session: SessionInfo | null = null;
  private initialized = false;
  private visibilityState = true;

  constructor(config: CricapSDKConfig) {
    this.config = config;
    this.eventEmitter = new CricapEventEmitter();
    this.messageHandler = new MessageHandler({
      targetOrigin: config.targetOrigin,
      debug: config.debug,
      timeout: config.timeout,
    });

    this.setupEventListeners();
  }

  /**
   * Set up internal event listeners for container events
   */
  private setupEventListeners(): void {
    // Listen for lifecycle events from container
    this.messageHandler.on('EVENT_LIFECYCLE', (payload: any) => {
      this.handleLifecycleEvent(payload);
    });

    this.messageHandler.on('EVENT_VISIBILITY', (payload: any) => {
      this.handleVisibilityEvent(payload);
    });

    // Listen for auth changes
    this.messageHandler.on('AUTH_RESPONSE', (payload: any) => {
      this.handleAuthResponse(payload);
    });

    // Listen for errors
    this.messageHandler.on('ERROR', (payload: any) => {
      this.handleError(payload);
    });

    // Set up visibility API listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        const visible = document.visibilityState === 'visible';
        this.visibilityState = visible;
        this.eventEmitter.emit('lifecycle:visibility', visible);
        
        if (this.config.eventHandlers?.onVisibilityChange) {
          this.config.eventHandlers.onVisibilityChange(visible);
        }
      });
    }

    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.eventEmitter.emit('network:online', true);
      });
      window.addEventListener('offline', () => {
        this.eventEmitter.emit('network:offline', false);
      });
    }
  }

  /**
   * Initialize the connection with the container
   */
  public async initialize(): Promise<InitResult> {
    if (this.initialized) {
      return {
        success: true,
        session: this.session || undefined,
      };
    }

    try {
      this.log('Initializing SDK...');

      // Send INIT message to container
      const response = await this.messageHandler.send('INIT', {
        appId: this.config.appId,
        version: this.config.version,
        environment: this.config.environment,
        timestamp: Date.now(),
      });

      if (response && (response as any).success !== false) {
        this.session = (response as any).session || null;
        this.initialized = true;

        this.log('SDK initialized successfully');

        // Emit init event
        this.eventEmitter.emit('init', this.session);
        if (this.config.eventHandlers?.onInit && this.session) {
          this.config.eventHandlers.onInit(this.session);
        }

        return {
          success: true,
          session: this.session || undefined,
        };
      } else {
        throw new Error((response as any)?.error?.message || 'Initialization failed');
      }
    } catch (error: any) {
      this.error('Initialization failed:', error);

      const sdkError: SDKError = {
        code: error.code || 'INIT_FAILED',
        message: error.message || 'Failed to initialize SDK',
        details: error.details,
        recoverable: true,
      };

      // Emit error event
      this.eventEmitter.emit('error', sdkError);
      if (this.config.eventHandlers?.onError) {
        this.config.eventHandlers.onError(sdkError);
      }

      return {
        success: false,
        error: sdkError,
      };
    }
  }

  /**
   * Check if SDK is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current session info
   */
  public getSession(): SessionInfo | null {
    return this.session;
  }

  /**
   * Get the message handler instance
   */
  public getMessageHandler(): MessageHandler {
    return this.messageHandler;
  }

  /**
   * Get the event emitter instance
   */
  public getEventEmitter(): CricapEventEmitter {
    return this.eventEmitter;
  }

  /**
   * Destroy the bridge and clean up resources
   */
  public destroy(): void {
    this.log('Destroying ContainerBridge...');
    this.messageHandler.destroy();
    this.eventEmitter.removeAllListeners();
    this.initialized = false;
    this.session = null;
  }

  /**
   * Handle lifecycle events from the container
   */
  private handleLifecycleEvent(payload: any): void {
    const { event } = payload || {};
    
    switch (event) {
      case 'show':
        this.eventEmitter.emit('lifecycle:show');
        if (this.config.eventHandlers?.onShow) {
          this.config.eventHandlers.onShow();
        }
        break;
      case 'hide':
        this.eventEmitter.emit('lifecycle:hide');
        if (this.config.eventHandlers?.onHide) {
          this.config.eventHandlers.onHide();
        }
        break;
      case 'close':
        this.eventEmitter.emit('lifecycle:close', payload.data);
        if (this.config.eventHandlers?.onClose) {
          this.config.eventHandlers.onClose(payload.data);
        }
        break;
      default:
        this.log('Unknown lifecycle event:', event);
    }
  }

  /**
   * Handle visibility events from the container
   */
  private handleVisibilityEvent(payload: any): void {
    const { visible } = payload || {};
    this.visibilityState = visible;
    this.eventEmitter.emit('lifecycle:visibility', visible);
    if (this.config.eventHandlers?.onVisibilityChange) {
      this.config.eventHandlers.onVisibilityChange(visible);
    }
  }

  /**
   * Handle auth response from the container
   */
  private handleAuthResponse(payload: any): void {
    const authState: AuthState = {
      authenticated: payload?.authenticated || false,
      user: payload?.user,
      token: payload?.token,
      expiresAt: payload?.expiresAt,
    };

    this.eventEmitter.emit('auth:change', authState);
    if (this.config.eventHandlers?.onAuthChange) {
      this.config.eventHandlers.onAuthChange(authState);
    }
  }

  /**
   * Handle errors from the container
   */
  private handleError(payload: any): void {
    const sdkError: SDKError = {
      code: payload?.code || 'UNKNOWN_ERROR',
      message: payload?.message || 'An unknown error occurred',
      details: payload?.details,
      recoverable: payload?.recoverable || false,
    };

    this.eventEmitter.emit('error', sdkError);
    if (this.config.eventHandlers?.onError) {
      this.config.eventHandlers.onError(sdkError);
    }
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[CricapSDK:ContainerBridge]', ...args);
    }
  }

  /**
   * Log error messages
   */
  private error(...args: any[]): void {
    console.error('[CricapSDK:ContainerBridge]', ...args);
  }
}
