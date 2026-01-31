/**
 * Google Merchant Center Automated Discounts
 * 
 * Validates JWT tokens from Google Shopping ads (pv2 URL parameter)
 * and extracts discounted pricing information.
 * 
 * @see https://support.google.com/merchants/answer/10295759
 */

import { jwtVerify, importSPKI } from 'jose';

// Google's public key for verifying automated discount JWTs
// This key does not expire and is provided by Google
const GOOGLE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAERUlUpxshr67EO66ZTX0Fpog0LEHc
nUnlSsIrOfroxTLu2XnigBK/lfYRxzQWq9K6nqsSjjYeea0T12r+y3nvqg==
-----END PUBLIC KEY-----`;

// JWT payload structure from Google
export interface GoogleDiscountPayload {
  exp: number;      // Expiration timestamp (valid for 60 minutes)
  m: string;        // Merchant ID
  o: string;        // Offer ID (product ID)
  c: string;        // Currency code (ISO 4217)
  p: number;        // Discounted price
  pp?: number;      // Prior price (for EEA countries)
}

// Validated discount ready for use
export interface GoogleDiscount {
  offerId: string;
  price: number;
  currency: string;
  priorPrice?: number;
  expiresAt: number;      // When discount expires (now + 48h for persistence)
  jwtExp: number;         // Original JWT expiration
  merchantId: string;
}

// Validation result
export type DiscountValidationResult = 
  | { success: true; discount: GoogleDiscount }
  | { success: false; error: string };

/**
 * Validate a Google automated discount JWT token
 * 
 * @param token - The JWT token from the pv2 URL parameter
 * @param expectedMerchantId - Your Google Merchant Center ID
 * @param expectedOfferId - The product/offer ID to validate against (optional)
 * @returns Validation result with discount data or error
 */
export async function validateDiscountToken(
  token: string,
  expectedMerchantId: string,
  expectedOfferId?: string
): Promise<DiscountValidationResult> {
  try {
    // Import the public key
    const publicKey = await importSPKI(GOOGLE_PUBLIC_KEY, 'ES256');
    
    // Verify and decode the JWT
    const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
      algorithms: ['ES256'],
    });
    
    // Validate header
    if (protectedHeader.alg !== 'ES256') {
      return { success: false, error: 'Invalid algorithm, expected ES256' };
    }
    if (protectedHeader.typ !== 'JWT') {
      return { success: false, error: 'Invalid token type, expected JWT' };
    }
    
    // Cast payload to our expected type
    const discountPayload = payload as unknown as GoogleDiscountPayload;
    
    // Validate required fields exist
    if (!discountPayload.exp || !discountPayload.m || !discountPayload.o || 
        !discountPayload.c || discountPayload.p === undefined) {
      return { success: false, error: 'Missing required fields in JWT payload' };
    }
    
    // Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (discountPayload.exp < now) {
      return { success: false, error: 'Token has expired' };
    }
    
    // Validate merchant ID
    if (discountPayload.m !== expectedMerchantId) {
      return { 
        success: false, 
        error: `Merchant ID mismatch: expected ${expectedMerchantId}, got ${discountPayload.m}` 
      };
    }
    
    // Validate offer ID if provided
    if (expectedOfferId && discountPayload.o !== expectedOfferId) {
      return { 
        success: false, 
        error: `Offer ID mismatch: expected ${expectedOfferId}, got ${discountPayload.o}` 
      };
    }
    
    // Validate price is a positive number
    if (typeof discountPayload.p !== 'number' || discountPayload.p <= 0) {
      return { success: false, error: 'Invalid price value' };
    }
    
    // Build the validated discount object
    const discount: GoogleDiscount = {
      offerId: discountPayload.o,
      price: discountPayload.p,
      currency: discountPayload.c,
      priorPrice: discountPayload.pp,
      expiresAt: Date.now() + (48 * 60 * 60 * 1000), // 48 hours from now
      jwtExp: discountPayload.exp,
      merchantId: discountPayload.m,
    };
    
    return { success: true, discount };
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.message.includes('signature')) {
        return { success: false, error: 'Invalid JWT signature' };
      }
      if (error.message.includes('expired')) {
        return { success: false, error: 'Token has expired' };
      }
      return { success: false, error: `JWT validation failed: ${error.message}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Extract the pv2 token from a URL or search params
 */
export function extractDiscountToken(url: string | URLSearchParams): string | null {
  if (typeof url === 'string') {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('pv2');
    } catch {
      return null;
    }
  }
  return url.get('pv2');
}

/**
 * Check if a discount is still valid (not expired)
 */
export function isDiscountValid(discount: GoogleDiscount): boolean {
  return Date.now() < discount.expiresAt;
}

/**
 * Format discounted price for display
 */
export function formatDiscountedPrice(discount: GoogleDiscount): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: discount.currency,
  }).format(discount.price);
}
