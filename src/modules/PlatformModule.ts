import type { MessageHandler } from '../core/MessageHandler';
import type { 
  PlatformModule,
  LeaderboardQuery,
  LeaderboardResponse,
  ScoreSubmission,
  ScoreSubmissionResult,
  GameStats,
  NotificationQuery,
  NotificationResponse,
  CricapSDKConfig 
} from '../types';

/**
 * PlatformModule handles platform-related operations including leaderboard,
 * score submission, game statistics, and notifications.
 */
export class PlatformModuleImpl implements PlatformModule {
  private messageHandler: MessageHandler;
  private config: CricapSDKConfig;

  constructor(messageHandler: MessageHandler, config: CricapSDKConfig) {
    this.messageHandler = messageHandler;
    this.config = config;
  }

  /**
   * Get leaderboard data
   */
  public async getLeaderboard(options: LeaderboardQuery): Promise<LeaderboardResponse> {
    try {
      this.log('Fetching leaderboard...', options);

      const response = await this.messageHandler.send('LEADERBOARD_REQUEST', {
        appId: this.config.appId,
        ...options,
        timestamp: Date.now(),
      });

      if (response && (response as any).entries) {
        const leaderboardResponse: LeaderboardResponse = {
          gameId: (response as any).gameId || options.gameId,
          period: (response as any).period || options.period || 'all-time',
          updatedAt: (response as any).updatedAt || new Date().toISOString(),
          entries: (response as any).entries,
          userRank: (response as any).userRank,
          pagination: (response as any).pagination || {
            hasMore: false,
            total: (response as any).entries.length,
          },
        };

        this.log('Leaderboard fetched successfully');
        return leaderboardResponse;
      } else {
        throw new Error('Invalid leaderboard response');
      }
    } catch (error: any) {
      this.error('Failed to fetch leaderboard:', error);
      throw error;
    }
  }

  /**
   * Submit a score to the leaderboard
   */
  public async submitScore(data: ScoreSubmission): Promise<ScoreSubmissionResult> {
    try {
      this.log('Submitting score...', { gameId: data.gameId, score: data.score });

      // Validate score
      if (typeof data.score !== 'number' || data.score < 0) {
        throw new Error('Invalid score: must be a non-negative number');
      }

      const response = await this.messageHandler.send('LEADERBOARD_RESPONSE', {
        appId: this.config.appId,
        action: 'submit',
        ...data,
        timestamp: Date.now(),
      });

      if (response && (response as any).submissionId) {
        const result: ScoreSubmissionResult = {
          submissionId: (response as any).submissionId,
          rank: (response as any).rank,
          previousRank: (response as any).previousRank,
          rankChange: (response as any).rankChange,
          newHighScore: (response as any).newHighScore || false,
          rewards: (response as any).rewards,
        };

        this.log('Score submitted successfully', result);
        return result;
      } else {
        throw new Error('Invalid score submission response');
      }
    } catch (error: any) {
      this.error('Failed to submit score:', error);
      throw error;
    }
  }

  /**
   * Get game statistics
   */
  public async getGameStats(gameId: string): Promise<GameStats> {
    try {
      this.log('Fetching game stats...', { gameId });

      const response = await this.messageHandler.send('LEADERBOARD_REQUEST', {
        appId: this.config.appId,
        gameId,
        requestType: 'stats',
        timestamp: Date.now(),
      });

      if (response && (response as any).gameId) {
        const gameStats: GameStats = {
          gameId: (response as any).gameId,
          totalPlayers: (response as any).totalPlayers || 0,
          totalGamesPlayed: (response as any).totalGamesPlayed || 0,
          averageScore: (response as any).averageScore || 0,
          topScore: (response as any).topScore || 0,
          userStats: (response as any).userStats,
        };

        this.log('Game stats fetched successfully');
        return gameStats;
      } else {
        throw new Error('Invalid game stats response');
      }
    } catch (error: any) {
      this.error('Failed to fetch game stats:', error);
      throw error;
    }
  }

  /**
   * Get notifications
   */
  public async getNotifications(options?: NotificationQuery): Promise<NotificationResponse> {
    try {
      this.log('Fetching notifications...', options);

      const response = await this.messageHandler.send('NOTIFICATION_SUBSCRIBE', {
        appId: this.config.appId,
        action: 'list',
        ...options,
        timestamp: Date.now(),
      });

      if (response && Array.isArray((response as any).notifications)) {
        const notificationResponse: NotificationResponse = {
          notifications: (response as any).notifications,
          unreadCount: (response as any).unreadCount || 0,
          pagination: (response as any).pagination || {
            hasMore: false,
            total: (response as any).notifications.length,
          },
        };

        this.log('Notifications fetched successfully');
        return notificationResponse;
      } else {
        // Return empty response
        return {
          notifications: [],
          unreadCount: 0,
          pagination: {
            hasMore: false,
            total: 0,
          },
        };
      }
    } catch (error: any) {
      this.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  public async markNotificationRead(notificationId: string): Promise<void> {
    try {
      this.log('Marking notification as read...', { notificationId });

      await this.messageHandler.send('NOTIFICATION_SUBSCRIBE', {
        appId: this.config.appId,
        action: 'markRead',
        notificationId,
        timestamp: Date.now(),
      });

      this.log('Notification marked as read');
    } catch (error: any) {
      this.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[CricapSDK:Platform]', ...args);
    }
  }

  /**
   * Log error messages
   */
  private error(...args: any[]): void {
    console.error('[CricapSDK:Platform]', ...args);
  }
}
