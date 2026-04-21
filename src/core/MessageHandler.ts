import type { 
  CricapMessage, 
  MessageType, 
  MessageResponse, 
  MessageError,
  CricapSDKConfig 
} from '../types';

/**
 * MessageHandler manages bidirectional communication between the mini app
 * and the Cricap container using postMessage API with origin validation.
 */
export class MessageHandler {
  private messageQueue: Map<string, { 
    resolve: (value: any) => void; 
    reject: (reason: any) => void;
    timeout: number;
  }> = new Map();
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private targetOrigin: string;
  private debug: boolean;
  private defaultTimeout: number;
  private messageListener: (event: MessageEvent) => void;

  constructor(config: { 
    targetOrigin?: string; 
    debug?: boolean;
    timeout?: number;
  }) {
    this.targetOrigin = config.targetOrigin || '*';
    this.debug = config.debug || false;
    this.defaultTimeout = config.timeout || 30000;
    this.messageListener = this.handleIncomingMessage.bind(this);
    this.setupMessageListener();
  }

  /**
   * Set up the message event listener
   */
  private setupMessageListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.messageListener);
      this.log('Message listener initialized');
    }
  }

  /**
   * Clean up the message event listener
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.messageListener);
    }
    // Reject all pending messages
    this.messageQueue.forEach(({ reject }) => {
      reject(new Error('MessageHandler destroyed'));
    });
    this.messageQueue.clear();
    this.eventListeners.clear();
  }

  /**
   * Handle incoming messages from the container
   */
  private handleIncomingMessage(event: MessageEvent): void {
    // Security: Validate origin if targetOrigin is specified
    if (this.targetOrigin !== '*' && event.origin !== this.targetOrigin) {
      this.warn('Rejected message from unauthorized origin:', event.origin);
      return;
    }

    // Validate message structure
    if (!this.isValidMessage(event.data)) {
      this.warn('Invalid message structure received');
      return;
    }

    const message = event.data as CricapMessage;
    this.log('Received message:', message.type, message.id);

    // Handle responses to pending messages
    if (this.messageQueue.has(message.id)) {
      const pending = this.messageQueue.get(message.id)!;
      this.messageQueue.delete(message.id);

      if (message.type === 'ERROR') {
        pending.reject(this.createErrorFromPayload(message.payload as MessageError));
      } else {
        pending.resolve(message.payload);
      }
      return;
    }

    // Handle events/notifications from container
    this.emit(message.type, message.payload);
  }

  /**
   * Validate that a message has the required structure
   */
  private isValidMessage(data: unknown): data is CricapMessage {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const msg = data as Partial<CricapMessage>;
    return (
      typeof msg.id === 'string' &&
      typeof msg.type === 'string' &&
      typeof msg.timestamp === 'number' &&
      typeof msg.source === 'string'
    );
  }

  /**
   * Create an Error object from a message error payload
   */
  private createErrorFromPayload(errorPayload: MessageError | undefined): Error {
    if (!errorPayload) {
      return new Error('Unknown error');
    }
    const error = new Error(errorPayload.message);
    (error as any).code = errorPayload.code;
    (error as any).details = errorPayload.details;
    return error;
  }

  /**
   * Send a message to the container and wait for a response
   * @param type - Message type
   * @param payload - Message payload
   * @param timeout - Timeout in milliseconds (optional)
   * @returns Promise that resolves with the response
   */
  public send<T = unknown>(
    type: MessageType,
    payload: unknown = {},
    timeout?: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.parent) {
        reject(new Error('Window or parent not available'));
        return;
      }

      const messageId = this.generateMessageId();
      const message: CricapMessage = {
        id: messageId,
        type,
        payload,
        timestamp: Date.now(),
        source: 'miniapp',
      };

      // Store promise handlers
      const messageTimeout = timeout || this.defaultTimeout;
      this.messageQueue.set(messageId, { resolve, reject, timeout: messageTimeout });

      // Send message to parent (container)
      try {
        window.parent.postMessage(message, this.targetOrigin);
        this.log('Sent message:', type, messageId);
      } catch (error) {
        this.messageQueue.delete(messageId);
        reject(new Error(`Failed to send message: ${error}`));
        return;
      }

      // Set timeout
      setTimeout(() => {
        if (this.messageQueue.has(messageId)) {
          this.messageQueue.delete(messageId);
          reject(new Error(`Message timeout: ${type} (after ${messageTimeout}ms)`));
        }
      }, messageTimeout);
    });
  }

  /**
   * Send a message without waiting for a response (fire-and-forget)
   * @param type - Message type
   * @param payload - Message payload
   */
  public sendAsync(type: MessageType, payload: unknown = {}): void {
    if (typeof window === 'undefined' || !window.parent) {
      this.warn('Cannot send message: window or parent not available');
      return;
    }

    const message: CricapMessage = {
      id: this.generateMessageId(),
      type,
      payload,
      timestamp: Date.now(),
      source: 'miniapp',
    };

    try {
      window.parent.postMessage(message, this.targetOrigin);
      this.log('Sent async message:', type);
    } catch (error) {
      this.warn('Failed to send async message:', error);
    }
  }

  /**
   * Register an event listener for messages from the container
   * @param event - Event/message type to listen for
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  public on(event: string, handler: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);

    this.log('Registered listener for event:', event);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(handler);
    };
  }

  /**
   * Emit an event to registered listeners
   * @param event - Event name
   * @param data - Event data
   */
  private emit(event: string, data: unknown): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.error('Event handler error:', error);
        }
      });
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[CricapSDK:MessageHandler]', ...args);
    }
  }

  /**
   * Log warning messages
   */
  private warn(...args: any[]): void {
    console.warn('[CricapSDK:MessageHandler]', ...args);
  }

  /**
   * Log error messages
   */
  private error(...args: any[]): void {
    console.error('[CricapSDK:MessageHandler]', ...args);
  }
}
