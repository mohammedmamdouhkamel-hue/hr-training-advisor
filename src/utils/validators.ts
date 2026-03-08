const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_EMPLOYEES = 500;
const API_KEY_PATTERN = /^sk-ant-[a-zA-Z0-9_-]{20,}$/;

export function validateFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
    return 'Unsupported format. Please upload .xlsx, .xls, or .csv.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`;
  }
  return null;
}

export function validateEmployeeCount(count: number): string | null {
  if (count > MAX_EMPLOYEES) {
    return `Too many employees (${count}). Maximum is ${MAX_EMPLOYEES}.`;
  }
  if (count === 0) {
    return 'Could not detect employee rows.';
  }
  return null;
}

export function validateApiKey(key: string): boolean {
  return API_KEY_PATTERN.test(key);
}

export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

export function sanitizeEmployeeData(value: string): string {
  return stripHtmlTags(value).trim();
}
