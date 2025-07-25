export type ControlSignal = 'pause' | 'resume' | 'cancel';
export type SignalEvent = 'onPause' | 'onResume' | 'onCancel' | 'onError';

export interface SignalEventPayloadMap {
  onPause: { at: Date; step: number };
  onResume: { at: Date; step: number };
  onCancel: { at: Date; step: number; reason?: string };
  onError: { at: Date; step: number; error: unknown };
}

export type SignalListener<E extends SignalEvent = SignalEvent> =
  (payload: SignalEventPayloadMap[E]) => void | Promise<void>;

type SignalState = 'running' | 'paused' | 'cancelling';

export class SignalBus {
  private state: SignalState = 'running';
  private listeners: Map<SignalEvent, Set<SignalListener>> = new Map();
  private resumePromise: Promise<void> | null = null;
  private resumeResolve: (() => void) | null = null;
  private abortController = new AbortController();
  private currentStep = 0;

  constructor() {
    // Initialize listener sets for each event type
    this.listeners.set('onPause', new Set());
    this.listeners.set('onResume', new Set());
    this.listeners.set('onCancel', new Set());
    this.listeners.set('onError', new Set());
  }

  /**
   * Send a control signal to the agent
   */
  send(signal: ControlSignal, reason?: string): void {
    switch (signal) {
      case 'pause':
        if (this.state === 'running') {
          this.state = 'paused';
          // Don't emit onPause immediately - let the loop emit it when it actually pauses
        }
        break;

      case 'resume':
        if (this.state === 'paused') {
          this.state = 'running';
          if (this.resumeResolve) {
            this.resumeResolve();
            this.resumeResolve = null;
            this.resumePromise = null;
          }
          this.emit('onResume', { at: new Date(), step: this.currentStep });
        }
        break;

      case 'cancel':
        this.state = 'cancelling';
        this.abortController.abort();
        this.emit('onCancel', { at: new Date(), step: this.currentStep, reason });
        // Wake up any waiting resume promise
        if (this.resumeResolve) {
          this.resumeResolve();
          this.resumeResolve = null;
          this.resumePromise = null;
        }
        break;
    }
  }

  /**
   * Subscribe to signal events
   */
  on<E extends SignalEvent>(event: E, listener: SignalListener<E>): () => void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener as SignalListener);
    }

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener as SignalListener);
      }
    };
  }

  /**
   * Emit a signal event to all listeners
   */
  emit<E extends SignalEvent>(event: E, payload: SignalEventPayloadMap[E]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Execute all listeners (fire and forget for async ones)
      Promise.allSettled(
        Array.from(eventListeners).map(listener => {
          try {
            const result = listener(payload);
            return result instanceof Promise ? result : Promise.resolve();
          } catch (error) {
            return Promise.reject(error);
          }
        })
      ).catch(errors => {
        console.error('Error in signal event listeners:', errors);
      });
    }
  }

  /**
   * Get current state
   */
  getState(): SignalState {
    return this.state;
  }

  /**
   * Wait until resumed (used by the loop when paused)
   */
  async waitUntilResumed(): Promise<void> {
    if (this.state !== 'paused') {
      return;
    }

    // Emit onPause when we actually pause
    this.emit('onPause', { at: new Date(), step: this.currentStep });

    if (!this.resumePromise) {
      this.resumePromise = new Promise<void>(resolve => {
        this.resumeResolve = resolve;
      });
    }

    return this.resumePromise;
  }

  /**
   * Update the current step index (called by the loop)
   */
  setStep(step: number): void {
    this.currentStep = step;
  }

  /**
   * Get the abort signal for cancellation
   */
  getAbortSignal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Check if cancellation was requested
   */
  isCancelling(): boolean {
    return this.state === 'cancelling';
  }

  /**
   * Emit an error event
   */
  emitError(error: unknown): void {
    this.emit('onError', { at: new Date(), step: this.currentStep, error });
  }
} 