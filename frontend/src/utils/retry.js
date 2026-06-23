// Retry mechanism for failed API calls with exponential backoff
export async function retryApiCall(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Don't retry on client errors (4xx) except timeout
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      // Wait before retrying with exponential backoff
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}
