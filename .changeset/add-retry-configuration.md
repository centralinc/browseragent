---
"@centralinc/browseragent": minor
---

feat: Add retry configuration for handling connection errors

- Add configurable retry logic with exponential backoff for API calls
- Create RetryConfig interface with customizable retry parameters
- Implement withRetry wrapper function for automatic retries on connection errors
- Support custom retry configuration in ComputerUseAgent constructor
- Default retry behavior: 3 attempts, 1s initial delay, 2x backoff multiplier
- Retryable errors include: Connection error, ECONNREFUSED, ETIMEDOUT, ECONNRESET, socket errors
- Add example demonstrating retry configuration usage
- Export RetryConfig type from main index
