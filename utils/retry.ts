import type { Logger } from "./logger";

export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    "Connection error",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ECONNRESET",
    "ENOTFOUND",
    "ENETUNREACH",
    "EAI_AGAIN",
    "socket hang up",
    "read ECONNRESET",
  ],
};

export function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  if (!error || typeof error !== "object") return false;
  
  const errorMessage = (error as Error).message || "";
  const errorStack = (error as Error).stack || "";
  
  return retryableErrors.some(
    (retryableError) =>
      errorMessage.includes(retryableError) || errorStack.includes(retryableError)
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig,
  logger?: Logger
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (
        attempt < finalConfig.maxRetries &&
        isRetryableError(error, finalConfig.retryableErrors)
      ) {
        const delay = Math.min(
          finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
          finalConfig.maxDelayMs
        );
        
        logger?.debug(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms`, {
          error: error instanceof Error ? error.message : String(error),
          attempt: attempt + 1,
          delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

