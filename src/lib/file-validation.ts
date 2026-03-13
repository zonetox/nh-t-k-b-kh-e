const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateCertificateFile(file: File): FileValidationResult {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Chỉ chấp nhận file ảnh JPG hoặc PNG',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Kích thước file không được vượt quá 5MB',
    };
  }

  // Check extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: 'Chỉ chấp nhận file có đuôi .jpg, .jpeg hoặc .png',
    };
  }

  return { valid: true };
}
