import type { MessageHandler } from '../core/MessageHandler';
import type { 
  AuthModule, 
  AuthState,
  CricapSDKConfig 
} from '../types';

/**
 * AuthModule handles authentication, token management, and session handling
 * for the Cricap Mini App SDK.
 */
export class AuthModuleImpl implements AuthModule {
  private messageHandler: MessageHandler;
  private config: CricapSDKConfig;
  private currentToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private authenticated = false;

  constructor(messageHandler: MessageHandler, config: CricapSDKConfig) {
    this.messageHandler = messageHandler;
    this.config = config;
  }

  /**
   * Get the current access token
   * If the token is expired, it will attempt to refresh it automatically
   */
  public async getToken(): Promise<string> {
    // Check if token is expired or about to expire (within 60 seconds)
    if (this.currentToken && this.tokenExpiresAt) {
      const expiresIn = this.tokenExpiresAt - Date.now();
      if (expiresIn > 60000) {
        return this.currentToken;
      }
    }

    // Token is expired or not available, try to refresh
    try {
      await this.refreshToken();
      if (this.currentToken) {
        return this.currentToken;
      }
    } catch (error) {
      this.error('Failed to refresh token:', error);
    }

    throw new Error('No valid authentication token available');
  }

  /**
   * Refresh the access token
   */
  public async refreshToken(): Promise<void> {
    try {
      this.log('Refreshing token...');

      const response = await this.messageHandler.send('AUTH_REFRESH', {
        appId: this.config.appId,
        timestamp: Date.now(),
      });

      if (response && (response as any).token) {
        this.currentToken = (response as any).token;
        this.tokenExpiresAt = (response as any).expiresAt || Date.now() + 3600000;
        this.authenticated = true;

        this.log('Token refreshed successfully');
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error: any) {
      this.error('Token refresh failed:', error);
      this.authenticated = false;
      this.currentToken = null;
      this.tokenExpiresAt = null;
      throw error;
    }
  }

  /**
   * Check if the user is currently authenticated
   */
  public isAuthenticated(): boolean {
    // Check if token is still valid
    if (this.authenticated && this.tokenExpiresAt) {
      return this.tokenExpiresAt > Date.now();
    }
    return false;
  }

  /**
   * Logout the current user
   */
  public async logout(): Promise<void> {
    try {
      this.log('Logging out...');

      await this.messageHandler.send('AUTH_REQUEST', {
        action: 'logout',
        appId: this.config.appId,
      });

      // Clear local state
      this.currentToken = null;
      this.tokenExpiresAt = null;
      this.authenticated = false;

      this.log('Logout successful');
    } catch (error) {
      this.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Request authentication from the container
   * This is typically called during initialization
   */
  public async requestAuth(): Promise<AuthState> {
    try {
      this.log('Requesting authentication...');

      const response = await this.messageHandler.send('AUTH_REQUEST', {
        appId: this.config.appId,
        permissions: [], // Container will use registered permissions
      });

      if (response && (response as any).authenticated) {
        this.currentToken = (response as any).token;
        this.tokenExpiresAt = (response as any).expiresAt;
        this.authenticated = true;

        const authState: AuthState = {
          authenticated: true,
          user: (response as any).user,
          token: this.currentToken,
          expiresAt: this.tokenExpiresAt,
        };

        this.log('Authentication successful');
        return authState;
      } else {
        this.authenticated = false;
        return {
          authenticated: false,
        };
      }
    } catch (error: any) {
      this.error('Authentication request failed:', error);
      this.authenticated = false;
      return {
        authenticated: false,
      };
    }
  }

  /**
   * Set token directly (used internally during initialization)
   */
  public setToken(token: string, expiresAt: number): void {
    this.currentToken = token;
    this.tokenExpiresAt = expiresAt;
    this.authenticated = true;
  }

  /**
   * Get current auth state
   */
  public getAuthState(): AuthState {
    return {
      authenticated: this.isAuthenticated(),
      user: undefined, // Would be populated from session
      token: this.currentToken || undefined,
      expiresAt: this.tokenExpiresAt || undefined,
    };
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[CricapSDK:Auth]', ...args);
    }
  }

  /**
   * Log error messages
   */
  private error(...args: any[]): void {
    console.error('[CricapSDK:Auth]', ...args);
  }
}
