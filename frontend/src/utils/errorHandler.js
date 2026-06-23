// Centralized error handling utility
export function getErrorMessage(error) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An error occurred. Please try again.';
}

export function isNetworkError(error) {
  return !error.response && error.message === 'Network Error';
}

export function isTimeoutError(error) {
  return error.code === 'ECONNABORTED';
}

export function isServerError(error) {
  return error.response?.status >= 500;
}

export function isClientError(error) {
  return error.response?.status >= 400 && error.response?.status < 500;
}

export function isUnauthorizedError(error) {
  return error.response?.status === 401;
}
