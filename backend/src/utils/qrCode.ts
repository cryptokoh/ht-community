import { v4 as uuidv4 } from 'uuid';

export function generateQRCode(): string {
  // Generate a unique QR code for the user
  // This will be used for check-ins and verification
  const timestamp = Date.now().toString(36);
  const randomString = uuidv4().replace(/-/g, '').substring(0, 8);
  
  return `HT_${timestamp}_${randomString}`.toUpperCase();
}

export function validateQRCode(qrCode: string): boolean {
  // Validate QR code format
  const qrCodePattern = /^HT_[A-Z0-9]+_[A-Z0-9]{8}$/;
  return qrCodePattern.test(qrCode);
}

export function extractTimestampFromQRCode(qrCode: string): Date | null {
  try {
    if (!validateQRCode(qrCode)) {
      return null;
    }
    
    const parts = qrCode.split('_');
    if (parts.length < 2) {
      return null;
    }
    
    const timestamp = parseInt(parts[1], 36);
    return new Date(timestamp);
  } catch {
    return null;
  }
}