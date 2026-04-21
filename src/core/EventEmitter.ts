import type { EventEmitter } from '../types';

/**
 * EventEmitter implementation for SDK event handling
 */
export class CricapEventEmitter implements EventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * Register an event listener
   * @param event - Event name
   * @param listener - Event handler function
   * @returns Unsubscribe function
   */
  on(event: string, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Remove an event listener
   * @param event - Event name
   * @param listener - Event handler function to remove
   */
  off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   * @param event - Event name
   * @param args - Arguments to pass to listeners
   */
  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Register a one-time event listener
   * @param event - Event name
   * @param listener - Event handler function
   * @returns Unsubscribe function
   */
  once(event: string, listener: EventListener): () => void {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Remove all listeners for an event or all events
   * @param event - Event name (optional, clears all if not provided)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param event - Event name
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }
}

// Type export for convenience
export type { EventListener };
