import type { MessageHandler } from '../core/MessageHandler';
import type { 
  UIModule,
  ShowOptions,
  CloseData,
  Dimensions,
  CricapSDKConfig 
} from '../types';

/**
 * UIModule handles UI-related operations for controlling the mini app container,
 * including showing, closing, resizing, and setting loading states.
 */
export class UIModuleImpl implements UIModule {
  private messageHandler: MessageHandler;
  private config: CricapSDKConfig;
  private isVisible = false;
  private currentDimensions: Dimensions = {};

  constructor(messageHandler: MessageHandler, config: CricapSDKConfig) {
    this.messageHandler = messageHandler;
    this.config = config;
  }

  /**
   * Show the mini app in the container
   */
  public async show(options?: ShowOptions): Promise<void> {
    try {
      this.log('Showing mini app...', options);

      // Validate options
      const validatedOptions = this.validateShowOptions(options);

      await this.messageHandler.send('UI_SHOW', {
        appId: this.config.appId,
        ...validatedOptions,
        timestamp: Date.now(),
      });

      this.isVisible = true;
      if (validatedOptions.dimensions) {
        this.currentDimensions = validatedOptions.dimensions;
      }

      this.log('Mini app shown successfully');
    } catch (error: any) {
      this.error('Failed to show mini app:', error);
      throw error;
    }
  }

  /**
   * Close the mini app
   */
  public async close(data?: CloseData): Promise<void> {
    try {
      this.log('Closing mini app...', data);

      await this.messageHandler.send('UI_CLOSE', {
        appId: this.config.appId,
        ...data,
        timestamp: Date.now(),
      });

      this.isVisible = false;
      this.log('Mini app closed successfully');
    } catch (error: any) {
      this.error('Failed to close mini app:', error);
      throw error;
    }
  }

  /**
   * Resize the container
   */
  public async resize(dimensions: Dimensions): Promise<void> {
    try {
      this.log('Resizing container...', dimensions);

      // Validate dimensions
      const validatedDimensions = this.validateDimensions(dimensions);

      await this.messageHandler.send('UI_RESIZE', {
        appId: this.config.appId,
        dimensions: validatedDimensions,
        timestamp: Date.now(),
      });

      this.currentDimensions = validatedDimensions;
      this.log('Container resized successfully');
    } catch (error: any) {
      this.error('Failed to resize container:', error);
      throw error;
    }
  }

  /**
   * Set the header title
   */
  public async setTitle(title: string): Promise<void> {
    try {
      this.log('Setting title...', { title });

      if (!title || typeof title !== 'string') {
        throw new Error('Invalid title: must be a non-empty string');
      }

      await this.messageHandler.send('UI_SHOW', {
        appId: this.config.appId,
        action: 'setTitle',
        title,
        timestamp: Date.now(),
      });

      this.log('Title set successfully');
    } catch (error: any) {
      this.error('Failed to set title:', error);
      throw error;
    }
  }

  /**
   * Show or hide the loading indicator
   */
  public async setLoading(visible: boolean): Promise<void> {
    try {
      this.log('Setting loading state...', { visible });

      await this.messageHandler.send('UI_SHOW', {
        appId: this.config.appId,
        action: 'setLoading',
        visible,
        timestamp: Date.now(),
      });

      this.log('Loading state set successfully');
    } catch (error: any) {
      this.error('Failed to set loading state:', error);
      throw error;
    }
  }

  /**
   * Request fullscreen mode
   */
  public async requestFullscreen(): Promise<void> {
    try {
      this.log('Requesting fullscreen...');

      await this.messageHandler.send('UI_SHOW', {
        appId: this.config.appId,
        action: 'requestFullscreen',
        timestamp: Date.now(),
      });

      this.log('Fullscreen requested');
    } catch (error: any) {
      this.error('Failed to request fullscreen:', error);
      throw error;
    }
  }

  /**
   * Exit fullscreen mode
   */
  public async exitFullscreen(): Promise<void> {
    try {
      this.log('Exiting fullscreen...');

      await this.messageHandler.send('UI_SHOW', {
        appId: this.config.appId,
        action: 'exitFullscreen',
        timestamp: Date.now(),
      });

      this.log('Fullscreen exited');
    } catch (error: any) {
      this.error('Failed to exit fullscreen:', error);
      throw error;
    }
  }

  /**
   * Check if the mini app is currently visible
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Get current dimensions
   */
  public getCurrentDimensions(): Dimensions {
    return { ...this.currentDimensions };
  }

  /**
   * Validate show options
   */
  private validateShowOptions(options?: ShowOptions): ShowOptions {
    const validated: ShowOptions = {};

    if (options) {
      // Validate animation
      if (options.animation && ['slide-up', 'fade', 'none'].includes(options.animation)) {
        validated.animation = options.animation;
      }

      // Validate style
      if (options.style && ['modal', 'fullscreen', 'sheet'].includes(options.style)) {
        validated.style = options.style;
      }

      // Validate overlay
      if (typeof options.overlay === 'boolean') {
        validated.overlay = options.overlay;
      }

      // Validate closeOnBackdrop
      if (typeof options.closeOnBackdrop === 'boolean') {
        validated.closeOnBackdrop = options.closeOnBackdrop;
      }

      // Validate dimensions
      if (options.dimensions) {
        validated.dimensions = this.validateDimensions(options.dimensions);
      }
    }

    return validated;
  }

  /**
   * Validate dimensions
   */
  private validateDimensions(dimensions: Dimensions): Dimensions {
    const validated: Dimensions = {};
    const validKeys: (keyof Dimensions)[] = ['width', 'height', 'maxWidth', 'maxHeight'];

    for (const key of validKeys) {
      const value = dimensions[key];
      if (value !== undefined) {
        if (typeof value === 'number' && value > 0) {
          validated[key] = value;
        } else if (typeof value === 'string' && 
                   (/^\d+(px|%|vh|vw|rem|em)$/.test(value) || value === 'auto')) {
          validated[key] = value;
        }
      }
    }

    return validated;
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[CricapSDK:UI]', ...args);
    }
  }

  /**
   * Log error messages
   */
  private error(...args: any[]): void {
    console.error('[CricapSDK:UI]', ...args);
  }
}
