import type { MessageHandler } from '../core/MessageHandler';
import type { 
  UserModule, 
  UserInfo,
  Permission,
  WalletBalance,
  TransactionQuery,
  TransactionResponse,
  CricapSDKConfig 
} from '../types';

/**
 * UserModule handles user-related operations including profile information,
 * wallet balance, and transaction history.
 */
export class UserModuleImpl implements UserModule {
  private messageHandler: MessageHandler;
  private config: CricapSDKConfig;
  private cachedUserInfo: UserInfo | null = null;
  private cachedWalletBalance: WalletBalance | null = null;
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(messageHandler: MessageHandler, config: CricapSDKConfig) {
    this.messageHandler = messageHandler;
    this.config = config;
  }

  /**
   * Get current user profile information
   */
  public async getInfo(): Promise<UserInfo> {
    // Check cache
    if (this.cachedUserInfo && this.isCacheValid('userInfo')) {
      this.log('Returning cached user info');
      return this.cachedUserInfo;
    }

    try {
      this.log('Fetching user info...');

      const response = await this.messageHandler.send('USER_INFO_REQUEST', {
        appId: this.config.appId,
        timestamp: Date.now(),
      });

      if (response && (response as any).userId) {
        const userInfo: UserInfo = {
          userId: (response as any).userId,
          username: (response as any).username,
          displayName: (response as any).displayName,
          avatarUrl: (response as any).avatarUrl,
          email: (response as any).email,
          verified: (response as any).verified || false,
          createdAt: (response as any).createdAt,
          stats: (response as any).stats,
        };

        // Cache the result
        this.cachedUserInfo = userInfo;
        this.setCacheValid('userInfo');

        this.log('User info fetched successfully');
        return userInfo;
      } else {
        throw new Error('Invalid user info response');
      }
    } catch (error: any) {
      this.error('Failed to fetch user info:', error);
      throw error;
    }
  }

  /**
   * Get permissions granted to the mini app for the current user
   */
  public async getPermissions(): Promise<Permission[]> {
    try {
      this.log('Fetching user permissions...');

      const response = await this.messageHandler.send('USER_INFO_REQUEST', {
        appId: this.config.appId,
        requestType: 'permissions',
        timestamp: Date.now(),
      });

      if (response && Array.isArray((response as any).permissions)) {
        const permissions: Permission[] = (response as any).permissions.map((p: any) => ({
          scope: p.scope,
          grantedAt: p.grantedAt,
          expiresAt: p.expiresAt,
        }));

        this.log('Permissions fetched successfully');
        return permissions;
      } else {
        return [];
      }
    } catch (error: any) {
      this.error('Failed to fetch permissions:', error);
      throw error;
    }
  }

  /**
   * Get current user's wallet balance
   */
  public async getWalletBalance(): Promise<WalletBalance> {
    // Check cache
    if (this.cachedWalletBalance && this.isCacheValid('walletBalance')) {
      this.log('Returning cached wallet balance');
      return this.cachedWalletBalance;
    }

    try {
      this.log('Fetching wallet balance...');

      const response = await this.messageHandler.send('WALLET_BALANCE_REQUEST', {
        appId: this.config.appId,
        timestamp: Date.now(),
      });

      if (response && (response as any).balances) {
        const walletBalance: WalletBalance = {
          userId: (response as any).userId,
          balances: (response as any).balances,
          totalUsdValue: (response as any).totalUsdValue || '0',
          updatedAt: (response as any).updatedAt || new Date().toISOString(),
        };

        // Cache the result
        this.cachedWalletBalance = walletBalance;
        this.setCacheValid('walletBalance');

        this.log('Wallet balance fetched successfully');
        return walletBalance;
      } else {
        throw new Error('Invalid wallet balance response');
      }
    } catch (error: any) {
      this.error('Failed to fetch wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get wallet transactions with optional filtering
   */
  public async getWalletTransactions(options?: TransactionQuery): Promise<TransactionResponse> {
    try {
      this.log('Fetching wallet transactions...', options);

      const response = await this.messageHandler.send('WALLET_BALANCE_REQUEST', {
        appId: this.config.appId,
        requestType: 'transactions',
        ...options,
        timestamp: Date.now(),
      });

      if (response && (response as any).transactions) {
        const transactionResponse: TransactionResponse = {
          transactions: (response as any).transactions,
          pagination: (response as any).pagination || {
            hasMore: false,
            total: (response as any).transactions.length,
          },
        };

        this.log('Transactions fetched successfully');
        return transactionResponse;
      } else {
        // Return empty response if no transactions
        return {
          transactions: [],
          pagination: {
            hasMore: false,
            total: 0,
          },
        };
      }
    } catch (error: any) {
      this.error('Failed to fetch transactions:', error);
      throw error;
    }
  }

  /**
   * Clear cached user data
   */
  public clearCache(): void {
    this.cachedUserInfo = null;
    this.cachedWalletBalance = null;
    this.cacheExpiry.clear();
    this.log('User cache cleared');
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    return Date.now() < expiry;
  }

  /**
   * Mark cache entry as valid
   */
  private setCacheValid(key: string): void {
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[CricapSDK:User]', ...args);
    }
  }

  /**
   * Log error messages
   */
  private error(...args: any[]): void {
    console.error('[CricapSDK:User]', ...args);
  }
}
