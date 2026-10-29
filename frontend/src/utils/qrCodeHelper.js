import QRCode from 'qrcode';

/**
 * Resolves the authoritative public HTTPS verification URL for a gate pass.
 * Never returns localhost URLs in QR codes meant to be scanned by normal mobile phones.
 */
export function getGatePassVerificationUrl(passCode) {
  const cleanCode = encodeURIComponent(String(passCode || '').trim());

  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || '';
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local');

    // If currently accessed from a live public HTTPS deployment (e.g. Render, custom domain), use that origin
    if (!isLocal && window.location.protocol === 'https:') {
      return `${window.location.origin}/verify-gate-pass/${cleanCode}`;
    }
  }

  // Authoritative production deployment URL on Render Cloud
  // Standard mobile phone cameras scanning QR codes will load this HTTPS URL
  return `https://aidemo-c4b9.onrender.com/verify-gate-pass/${cleanCode}`;
}

/**
 * Generates an authentic, high-contrast, sharp QR Code Data URL (PNG base64)
 * Compliant with ISO/IEC 18004 specification with error correction level M and quiet zone margin.
 */
export async function generateScannableQrDataUrl(text, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 1.0,
    margin: 3, // 3-module quiet zone for reliable camera detection
    width: 320,
    color: {
      dark: '#000000',  // Pure black modules
      light: '#ffffff'  // Pure white background
    }
  };

  const merged = { ...defaultOptions, ...options };
  return await QRCode.toDataURL(text, merged);
}
