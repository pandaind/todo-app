/**
 * Utility functions for handling and formatting API errors
 */

export const getErrorMessage = (error: any, defaultMessage: string = 'An unexpected error occurred'): string => {
  // If it's already an Error object
  if (error instanceof Error) {
    return error.message;
  }

  // If it's a string
  if (typeof error === 'string') {
    return error;
  }

  // If it's an object with a message property
  if (error && typeof error === 'object' && error.message) {
    return error.message;
  }

  // If it's an object with a detail property (FastAPI error format)
  if (error && typeof error === 'object' && error.detail) {
    return error.detail;
  }

  return defaultMessage;
};

export const getNetworkErrorMessage = (error: any): string => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (error.message && error.message.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }

  if (error.message && error.message.includes('403')) {
    return 'You do not have permission to perform this action.';
  }

  if (error.message && error.message.includes('404')) {
    return 'The requested resource was not found.';
  }

  if (error.message && error.message.includes('500')) {
    return 'An internal server error occurred. Please try again later.';
  }

  return getErrorMessage(error, 'A network error occurred. Please try again.');
};

export const getUserFriendlyErrorMessage = (error: any, operation: string): string => {
  // First try to get a specific network error message
  const networkMessage = getNetworkErrorMessage(error);
  const baseErrorMessage = getErrorMessage(error);
  
  // If we have a specific network error message and it's different from the base message, use it
  if (networkMessage !== baseErrorMessage && networkMessage !== 'A network error occurred. Please try again.') {
    return networkMessage;
  }

  // Operation-specific error messages
  const operationMessages: { [key: string]: string } = {
    'login': 'Failed to log in. Please check your credentials and try again.',
    'signup': 'Failed to create account. Please check your information and try again.',
    'create_todo': 'Failed to create todo. Please try again.',
    'update_todo': 'Failed to update todo. Please try again.',
    'delete_todo': 'Failed to delete todo. Please try again.',
    'fetch_todos': 'Failed to load todos. Please refresh the page.',
    'toggle_complete': 'Failed to update todo status. Please try again.',
    'toggle_starred': 'Failed to update todo favorite status. Please try again.',
    'archive_todo': 'Failed to archive todo. Please try again.',
    'generate_subtasks': 'Failed to generate subtasks. Please check your API key and try again.',
  };

  const baseMessage = operationMessages[operation] || `Failed to ${operation.replace('_', ' ')}. Please try again.`;
  
  // Get the actual error message without the [object Object] issue
  let errorDetail = '';
  if (error instanceof Error) {
    errorDetail = error.message;
  } else if (typeof error === 'string') {
    errorDetail = error;
  } else if (error && typeof error === 'object') {
    errorDetail = error.detail || error.message || '';
  }

  // Only append error detail if it's meaningful and not a generic message
  if (errorDetail && 
      errorDetail !== 'An unexpected error occurred' && 
      errorDetail !== '[object Object]' &&
      errorDetail !== baseMessage &&
      !errorDetail.includes('HTTP') &&
      errorDetail.length > 0 &&
      errorDetail !== 'undefined') {
    return `${baseMessage} (${errorDetail})`;
  }

  return baseMessage;
};
