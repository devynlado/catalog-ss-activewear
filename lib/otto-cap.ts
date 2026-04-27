/**
 * Otto Cap API Client
 * 
 * Handles authentication, inventory lookups, and order submission
 * for Otto Cap supplier integration.
 * 
 * API Endpoints:
 * - POST /authenticate/token/ - Get access token
 * - GET /inventory?sku=X&supplier=Y - Get real-time inventory
 * - POST /orders - Submit orders
 * - GET /shipping_methods - Available shipping options
 * - GET /payment_methods - Available payment options
 * - GET /customers - Customer account info
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const OTTO_API_URL = process.env.OTTOCAP_API_URL || 'https://sandbox-api.ottocap.com';
const OTTO_CLIENT_ID = process.env.OTTOCAP_CLIENT_ID || '';
const OTTO_CLIENT_SECRET = process.env.OTTOCAP_CLIENT_SECRET || '';
const OTTO_USERNAME = process.env.OTTOCAP_USERNAME || '';
const OTTO_PASSWORD = process.env.OTTOCAP_PASSWORD || '';
const OTTO_SUPPLIER_ID = process.env.OTTOCAP_SUPPLIER_ID || '00ceb24d-9b6f-4ba1-91c8-aa375ab96651';

// ============================================================================
// TYPES
// ============================================================================

export interface OttoAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

export interface OttoWarehouseStock {
  warehouse: string;  // 'otto_ca', 'otto_tx', 'otto_ga'
  stock: number;
}

export interface OttoPriceTier {
  qty: number;
  price: number;
  sale_price: number | null;
  sale_from: string | null;
  sale_to: string | null;
}

export interface OttoInventoryResponse {
  total_stock: number;
  status: number;
  warehouse_stock: OttoWarehouseStock[];
  latest_price: OttoPriceTier[];
}

export interface OttoShippingMethod {
  id: string;
  code: string;
  type: 'normal' | 'third_party';
}

export interface OttoPaymentMethod {
  name: string;
  code: string;
}

export interface OttoCustomerContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface OttoCustomer {
  id: string;
  company_name: string;
  contacts: OttoCustomerContact[];
}

export interface OttoOrderItem {
  sku: string;
  quantity: number;
}

export interface OttoOrderAddress {
  company_name?: string;
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface OttoOrderRequest {
  customer_id: string;
  po_number: string;
  shipping_method_id: string;
  payment_method: string;
  ship_to: OttoOrderAddress;
  items: OttoOrderItem[];
  notes?: string;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Authenticate with Otto Cap API and get access token
 */
export async function authenticate(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  console.log('[Otto Cap] Authenticating...');

  // Build Basic Auth header from client_id:client_secret
  const basicAuth = Buffer.from(`${OTTO_CLIENT_ID}:${OTTO_CLIENT_SECRET}`).toString('base64');

  // Build form-urlencoded body
  const body = new URLSearchParams({
    username: OTTO_USERNAME,
    password: OTTO_PASSWORD,
    grant_type: 'password',
  });

  const response = await fetch(`${OTTO_API_URL}/authenticate/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Otto Cap] Authentication failed:', response.status, errorText);
    throw new Error(`Otto Cap authentication failed: ${response.status}`);
  }

  const data: OttoAuthResponse = await response.json();
  
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);
  
  console.log('[Otto Cap] Authentication successful, token expires in', data.expires_in, 'seconds');
  
  return cachedToken;
}

/**
 * Make an authenticated request to Otto Cap API
 */
async function ottoRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await authenticate();

  const response = await fetch(`${OTTO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Otto Cap] Request failed: ${endpoint}`, response.status, errorText);
    throw new Error(`Otto Cap API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============================================================================
// INVENTORY FUNCTIONS
// ============================================================================

/**
 * Get real-time inventory for a specific SKU
 * 
 * @param sku - Full Otto Cap SKU (e.g., "31-069-001")
 * @returns Inventory data with stock levels and pricing
 */
export async function getInventory(sku: string): Promise<OttoInventoryResponse> {
  return ottoRequest<OttoInventoryResponse>(
    `/inventory?sku=${encodeURIComponent(sku)}&supplier=${OTTO_SUPPLIER_ID}`
  );
}

/**
 * Get inventory for multiple SKUs
 * 
 * @param skus - Array of Otto Cap SKUs
 * @returns Map of SKU to inventory data
 */
export async function getInventoryBatch(skus: string[]): Promise<Map<string, OttoInventoryResponse>> {
  const results = new Map<string, OttoInventoryResponse>();
  
  // Process in parallel batches of 10
  const BATCH_SIZE = 10;
  for (let i = 0; i < skus.length; i += BATCH_SIZE) {
    const batch = skus.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (sku) => {
      try {
        const inventory = await getInventory(sku);
        results.set(sku, inventory);
      } catch (error) {
        console.error(`[Otto Cap] Failed to get inventory for ${sku}:`, error);
      }
    });
    await Promise.all(promises);
  }
  
  return results;
}

/**
 * Check if a SKU is in stock
 */
export async function isInStock(sku: string, minQty: number = 1): Promise<boolean> {
  try {
    const inventory = await getInventory(sku);
    return inventory.total_stock >= minQty;
  } catch {
    return false;
  }
}

// ============================================================================
// SHIPPING & PAYMENT METHODS
// ============================================================================

/**
 * Get available shipping methods
 */
export async function getShippingMethods(): Promise<OttoShippingMethod[]> {
  return ottoRequest<OttoShippingMethod[]>('/shipping_methods');
}

/**
 * Get available payment methods
 */
export async function getPaymentMethods(): Promise<OttoPaymentMethod[]> {
  return ottoRequest<OttoPaymentMethod[]>('/payment_methods');
}

// ============================================================================
// CUSTOMER FUNCTIONS
// ============================================================================

/**
 * Get customer account information
 */
export async function getCustomers(): Promise<OttoCustomer[]> {
  return ottoRequest<OttoCustomer[]>('/customers');
}

// ============================================================================
// ORDER FUNCTIONS
// ============================================================================

/**
 * Submit an order to Otto Cap
 * 
 * Note: For initial implementation, orders will be processed manually.
 * This function is prepared for future automated ordering.
 * 
 * @param order - Order details
 * @returns Order confirmation response
 */
export async function submitOrder(order: OttoOrderRequest): Promise<any> {
  console.log('[Otto Cap] Submitting order:', order.po_number);
  
  return ottoRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

// ============================================================================
// INVENTORY SYNC FUNCTIONS
// ============================================================================

/**
 * Sync inventory from Otto Cap API to database
 * Updates qty and availability for Otto Cap SKUs
 * 
 * @param skus - Optional list of SKUs to sync. If not provided, syncs all Otto Cap SKUs.
 */
export async function syncInventory(skus?: string[]): Promise<{
  updated: number;
  errors: number;
}> {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // If no SKUs provided, get all Otto Cap SKUs from database
  if (!skus) {
    const { data } = await supabase
      .from('product_skus')
      .select('sku')
      .eq('supplier', 'otto_cap');
    
    skus = (data || []).map(row => row.sku);
  }
  
  console.log(`[Otto Cap] Syncing inventory for ${skus.length} SKUs...`);
  
  let updated = 0;
  let errors = 0;
  
  // Process in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < skus.length; i += BATCH_SIZE) {
    const batch = skus.slice(i, i + BATCH_SIZE);
    
    // Get inventory for batch
    const inventoryMap = await getInventoryBatch(batch);
    
    // Update database
    for (const [sku, inventory] of inventoryMap) {
      try {
        const { error } = await supabase
          .from('product_skus')
          .update({
            qty: inventory.total_stock,
            availability: inventory.total_stock > 0 ? 'in_stock' : 'out_of_stock',
            last_inventory_sync: new Date().toISOString(),
          })
          .eq('sku', sku);
        
        if (error) {
          console.error(`[Otto Cap] Failed to update ${sku}:`, error);
          errors++;
        } else {
          updated++;
        }
      } catch (err) {
        console.error(`[Otto Cap] Error updating ${sku}:`, err);
        errors++;
      }
    }
    
    console.log(`[Otto Cap] Progress: ${Math.min(i + BATCH_SIZE, skus.length)} / ${skus.length}`);
  }
  
  console.log(`[Otto Cap] Inventory sync complete. Updated: ${updated}, Errors: ${errors}`);
  
  return { updated, errors };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if Otto Cap API is configured and accessible
 */
export async function healthCheck(): Promise<{
  configured: boolean;
  authenticated: boolean;
  error?: string;
}> {
  // Check configuration
  if (!OTTO_CLIENT_ID || !OTTO_CLIENT_SECRET || !OTTO_USERNAME || !OTTO_PASSWORD) {
    return {
      configured: false,
      authenticated: false,
      error: 'Missing Otto Cap credentials in environment variables',
    };
  }
  
  // Try to authenticate
  try {
    await authenticate();
    return {
      configured: true,
      authenticated: true,
    };
  } catch (error) {
    return {
      configured: true,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Get the warehouse code for a location
 */
export function getWarehouseCode(warehouse: string): string {
  const codes: Record<string, string> = {
    'otto_ca': 'California',
    'otto_tx': 'Texas',
    'otto_ga': 'Georgia',
  };
  return codes[warehouse] || warehouse;
}
