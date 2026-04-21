import type { MessageHandler } from '../core/MessageHandler';
import type { 
  NotificationModule,
  Notification,
  SubscriptionResult,
  NotificationHandler,
  CricapSDKConfig 
} from '../types';

/**
 * NotificationModule handles real-time notifications via topic subscription
 * for the Cricap Mini App SDK.
 */
export class NotificationModuleImpl implements NotificationModule {
  private messageHandler: MessageHandler;
  private config: CricapSDKConfig;
  private subscribedTopics: Set<string> = new Set();
  private notificationHandlers: Set<NotificationHandler> = new Set();
  private pendingNotifications: Notification[] = [];
  private unsubscribeMessageListener: (() => void) | null = null;

  constructor(messageHandler: MessageHandler, config: CricapSDKConfig) {
    this.messageHandler = messageHandler;
    this.config = config;
    this.setupNotificationListener();
  }

  /**
   * Set up listener for incoming notifications
   */
  private setupNotificationListener(): void {
    this.unsubscribeMessageListener = this.messageHandler.on('NOTIFICATION_RECEIVE', (payload: any) => {
      this.handleIncomingNotification(payload);
    });
  }

  /**
   * Subscribe to notification topics
   */
  public async subscribe(topics: string[]): Promise<SubscriptionResult> {
    try {
      this.log('Subscribing to topics...', topics);

      // Validate topics
      const validTopics = topics.filter(topic => 
        typeof topic === 'string' && topic.length > 0
      );

      if (validTopics.length === 0) {
        throw new Error('No valid topics provided');
      }

      const response = await this.messageHandler.send('NOTIFICATION_SUBSCRIBE', {
        appId: this.config.appId,
        action: 'subscribe',
        topics: validTopics,
        timestamp: Date.now(),
      });

      const result: SubscriptionResult = {
        success: (response as any)?.success !== false,
        subscribed: (response as any)?.subscribed || validTopics,
        failed: (response as any)?.failed || [],
      };

      // Track subscribed topics
      result.subscribed.forEach(topic => this.subscribedTopics.add(topic));

      this.log('Subscription result:', result);
      return result;
    } catch (error: any) {
      this.error('Failed to subscribe to topics:', error);
      
      return {
        success: false,
        subscribed: [],
        failed: topics,
      };
    }
  }

  /**
   * Unsubscribe from notification topics
   */
  public async unsubscribe(topics: string[]): Promise<void> {
    try {
      this.log('Unsubscribing from topics...', topics);

      const validTopics = topics.filter(topic => 
        typeof topic === 'string' && topic.length > 0
      );

      await this.messageHandler.send('NOTIFICATION_SUBSCRIBE', {
        appId: this.config.appId,
        action: 'unsubscribe',
        topics: validTopics,
        timestamp: Date.now(),
      });

      // Remove from tracked topics
      validTopics.forEach(topic => this.subscribedTopics.delete(topic));

      this.log('Unsubscribed successfully');
    } catch (error: any) {
      this.error('Failed to unsubscribe from topics:', error);
      throw error;
    }
  }

  /**
   * Register a notification handler
   * @returns Unsubscribe function
   */
  public onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.add(handler);
    this.log('Notification handler registered');

    // Process any pending notifications
    while (this.pendingNotifications.length > 0) {
      const notification = this.pendingNotifications.shift();
      if (notification) {
        handler(notification);
      }
    }

    // Return unsubscribe function
    return () => {
      this.notificationHandlers.delete(handler);
      this.log('Notification handler unregistered');
    };
  }

  /**
   * Get pending notifications that arrived before handlers were registered
   */
  public async getPending(): Promise<Notification[]> {
    try {
      this.log('Fetching pending notifications...');

      const response = await this.messageHandler.send('NOTIFICATION_SUBSCRIBE', {
        appId: this.config.appId,
        action: 'getPending',
        timestamp: Date.now(),
      });

      const notifications: Notification[] = (response as any)?.notifications || [];
      this.log('Pending notifications fetched:', notifications.length);
      
      return notifications;
    } catch (error: any) {
      this.error('Failed to fetch pending notifications:', error);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  public async markAsRead(notificationId: string): Promise<void> {
    try {
      this.log('Marking notification as read...', { notificationId });

      if (!notificationId || typeof notificationId !== 'string') {
        throw new Error('Invalid notification ID');
      }

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
   * Get list of currently subscribed topics
   */
  public getSubscribedTopics(): string[] {
    return Array.from(this.subscribedTopics);
  }

  /**
   * Handle incoming notification from the container
   */
  private handleIncomingNotification(payload: any): void {
    const notification: Notification = {
      id: payload?.id || `notif_${Date.now()}`,
      type: payload?.type || 'CUSTOM',
      topic: payload?.topic || 'unknown',
      title: payload?.title || 'Notification',
      body: payload?.body || '',
      data: payload?.data,
      timestamp: payload?.timestamp || Date.now(),
      read: payload?.read || false,
      priority: payload?.priority || 'normal',
    };

    this.log('Received notification:', notification.title);

    // If no handlers registered, queue the notification
    if (this.notificationHandlers.size === 0) {
      this.pendingNotifications.push(notification);
      // Keep only last 50 pending notifications
      if (this.pendingNotifications.length > 50) {
        this.pendingNotifications.shift();
      }
      return;
    }

    // Notify all handlers
    this.notificationHandlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        this.error('Error in notification handler:', error);
      }
    });

    // Also call the global handler if configured
    if (this.config.eventHandlers?.onNotification) {
      try {
        this.config.eventHandlers.onNotification(notification);
      } catch (error) {
        this.error('Error in global notification handler:', error);
      }
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.log('Destroying NotificationModule...');
    
    if (this.unsubscribeMessageListener) {
      this.unsubscribeMessageListener();
    }
    
    this.notificationHandlers.clear();
    this.subscribedTopics.clear();
    this.pendingNotifications = [];
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[CricapSDK:Notifications]', ...args);
    }
  }

  /**
   * Log error messages
   */
  private error(...args: any[]): void {
    console.error('[CricapSDK:Notifications]', ...args);
  }
}
