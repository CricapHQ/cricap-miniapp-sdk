import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CricapEventEmitter } from '../src/core/EventEmitter';

describe('CricapEventEmitter', () => {
  let emitter: CricapEventEmitter;

  beforeEach(() => {
    emitter = new CricapEventEmitter();
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  describe('on', () => {
    it('should register an event listener', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.emit('test', 'data');
      expect(handler).toHaveBeenCalledWith('data');
    });

    it('should return an unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = emitter.on('test', handler);
      unsubscribe();
      emitter.emit('test', 'data');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple listeners for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.emit('test', 'data');
      expect(handler1).toHaveBeenCalledWith('data');
      expect(handler2).toHaveBeenCalledWith('data');
    });
  });

  describe('off', () => {
    it('should remove a specific listener', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.off('test', handler);
      emitter.emit('test', 'data');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should pass multiple arguments to listeners', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.emit('test', 1, 2, 3);
      expect(handler).toHaveBeenCalledWith(1, 2, 3);
    });

    it('should not throw if no listeners exist', () => {
      expect(() => emitter.emit('nonexistent')).not.toThrow();
    });
  });

  describe('once', () => {
    it('should only trigger the listener once', () => {
      const handler = vi.fn();
      emitter.once('test', handler);
      emitter.emit('test', 'first');
      emitter.emit('test', 'second');
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('first');
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for a specific event', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.removeAllListeners('test');
      emitter.emit('test', 'data');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should remove all listeners for all events when no event specified', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('test1', handler1);
      emitter.on('test2', handler2);
      emitter.removeAllListeners();
      emitter.emit('test1', 'data');
      emitter.emit('test2', 'data');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return the number of listeners for an event', () => {
      expect(emitter.listenerCount('test')).toBe(0);
      emitter.on('test', vi.fn());
      expect(emitter.listenerCount('test')).toBe(1);
      emitter.on('test', vi.fn());
      expect(emitter.listenerCount('test')).toBe(2);
    });
  });
});
