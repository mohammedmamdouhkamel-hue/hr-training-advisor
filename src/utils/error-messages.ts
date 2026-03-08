export function getApiErrorMessage(status: number, message?: string): string {
  switch (status) {
    case 401:
      return 'Invalid API key. Get a new one at console.anthropic.com';
    case 429:
      return 'Rate limit reached. Wait 30 seconds and try again.';
    case 500:
    case 502:
    case 503:
      return 'Anthropic servers temporarily unavailable. Try again in a moment.';
    default:
      return message || `API error ${status}`;
  }
}

export function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Check your internet connection and try again.';
  }
  if (error instanceof SyntaxError) {
    return 'AI returned unexpected format. Try generating again.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
