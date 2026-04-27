/**
 * Otto Cap API Test Script
 * 
 * Tests authentication and explores the API response structure
 * Run with: npx ts-node scripts/test-ottocap-api.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const OTTOCAP_API_URL = process.env.OTTOCAP_API_URL || 'https://api.ssconnectivity.com/ottocap';
const OTTOCAP_CLIENT_ID = process.env.OTTOCAP_CLIENT_ID;
const OTTOCAP_CLIENT_SECRET = process.env.OTTOCAP_CLIENT_SECRET;
const OTTOCAP_USERNAME = process.env.OTTOCAP_USERNAME;
const OTTOCAP_PASSWORD = process.env.OTTOCAP_PASSWORD;

// Otto Cap's supplier ID (constant from their docs)
const OTTO_SUPPLIER_ID = process.env.OTTOCAP_SUPPLIER_ID || '00ceb24d-9b6f-4ba1-91c8-aa375ab96651';

interface AuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

async function authenticate(): Promise<string> {
  console.log('\n🔐 Step 1: Authenticating with Otto Cap API...');
  console.log(`   URL: ${OTTOCAP_API_URL}/authenticate/token/`);
  
  // Build Basic Auth header from client_id:client_secret
  const basicAuth = Buffer.from(`${OTTOCAP_CLIENT_ID}:${OTTOCAP_CLIENT_SECRET}`).toString('base64');
  
  // Build form-urlencoded body
  const body = new URLSearchParams({
    username: OTTOCAP_USERNAME!,
    password: OTTOCAP_PASSWORD!,
    grant_type: 'password',
  });
  
  const response = await fetch(`${OTTOCAP_API_URL}/authenticate/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Authentication failed:', response.status, errorText);
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data: AuthResponse = await response.json();
  console.log('✅ Authentication successful!');
  console.log('   Token type:', data.token_type);
  console.log('   Expires in:', data.expires_in, 'seconds');
  
  return data.access_token;
}

async function getPaymentMethods(token: string): Promise<void> {
  console.log('\n💳 Step 2: Getting available payment methods...');
  
  const response = await fetch(`${OTTOCAP_API_URL}/payment_methods`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('❌ Failed to get payment methods:', response.status);
    return;
  }

  const data = await response.json();
  console.log('✅ Payment methods:');
  console.log(JSON.stringify(data, null, 2));
}

async function getShippingMethods(token: string): Promise<void> {
  console.log('\n🚚 Step 3: Getting available shipping methods...');
  
  const response = await fetch(`${OTTOCAP_API_URL}/shipping_methods`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('❌ Failed to get shipping methods:', response.status);
    return;
  }

  const data = await response.json();
  console.log('✅ Shipping methods:');
  console.log(JSON.stringify(data, null, 2));
}

async function getInventory(token: string, sku?: string): Promise<any> {
  console.log('\n📦 Step 4: Getting inventory data...');
  
  let url = `${OTTOCAP_API_URL}/inventory?supplier=${OTTO_SUPPLIER_ID}`;
  if (sku) {
    url += `&sku=${sku}`;
    console.log(`   Fetching specific SKU: ${sku}`);
  } else {
    console.log('   Fetching full inventory (this may take a moment)...');
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Failed to get inventory:', response.status, errorText);
    return null;
  }

  const data = await response.json();
  return data;
}

function analyzeInventoryStructure(data: any): void {
  console.log('\n📊 Analyzing inventory response structure...\n');
  
  // Check if it's an array or object
  if (Array.isArray(data)) {
    console.log(`Response is an ARRAY with ${data.length} items`);
    
    if (data.length > 0) {
      const firstItem = data[0];
      console.log('\n--- First item structure ---');
      analyzeObject(firstItem, '');
      
      console.log('\n--- First item raw JSON (sample) ---');
      console.log(JSON.stringify(firstItem, null, 2));
      
      // Look for unique field values across multiple items
      if (data.length > 1) {
        console.log('\n--- Sample of 3 different items ---');
        const samples = data.slice(0, 3);
        samples.forEach((item: any, index: number) => {
          console.log(`\nItem ${index + 1}:`);
          console.log(`  SKU: ${item.sku || item.SKU || 'N/A'}`);
          console.log(`  Name: ${item.name || item.product_name || item.title || 'N/A'}`);
          console.log(`  Price: ${item.price || item.piece_price || 'N/A'}`);
          console.log(`  Stock: ${item.qty || item.stock || item.quantity || 'N/A'}`);
        });
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    console.log('Response is an OBJECT');
    console.log('\n--- Object structure ---');
    analyzeObject(data, '');
    
    console.log('\n--- Raw JSON ---');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('Unexpected response type:', typeof data);
    console.log(data);
  }
}

function analyzeObject(obj: any, prefix: string): void {
  for (const [key, value] of Object.entries(obj)) {
    const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
    const sampleValue = getSampleValue(value);
    console.log(`${prefix}${key}: ${type}${sampleValue ? ` = ${sampleValue}` : ''}`);
    
    // Recurse into nested objects (but not too deep)
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && prefix.length < 6) {
      analyzeObject(value, prefix + '  ');
    }
    
    // Show first item of arrays
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      console.log(`${prefix}  [0] (first item):`);
      analyzeObject(value[0], prefix + '    ');
    }
  }
}

function getSampleValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    if (value.length > 50) return `"${value.substring(0, 50)}..."`;
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

async function getCustomerList(token: string): Promise<void> {
  console.log('\n👥 Step 5: Getting customer list (for order submission)...');
  
  const response = await fetch(`${OTTOCAP_API_URL}/customers`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('❌ Failed to get customers:', response.status);
    const errorText = await response.text();
    console.error('   Error:', errorText);
    return;
  }

  const data = await response.json();
  console.log('✅ Customer data:');
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           OTTO CAP API EXPLORATION SCRIPT');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Verify credentials are present
  if (!OTTOCAP_CLIENT_ID || !OTTOCAP_CLIENT_SECRET || !OTTOCAP_USERNAME || !OTTOCAP_PASSWORD) {
    console.error('❌ Missing Otto Cap credentials in .env.local');
    console.error('   Required: OTTOCAP_CLIENT_ID, OTTOCAP_CLIENT_SECRET, OTTOCAP_USERNAME, OTTOCAP_PASSWORD');
    process.exit(1);
  }
  
  console.log('✓ Credentials found');
  console.log(`✓ API URL: ${OTTOCAP_API_URL}`);
  
  try {
    // Step 1: Authenticate
    const token = await authenticate();
    
    // Step 2: Get payment methods
    await getPaymentMethods(token);
    
    // Step 3: Get shipping methods  
    await getShippingMethods(token);
    
    // Step 4: Get inventory for specific product (31-069-001 - popular cap, black)
    // SKU format: {style}-{colorcode} e.g., 31-069-001
    console.log('\n' + '─'.repeat(60));
    console.log('FETCHING SPECIFIC PRODUCT: 31-069-001 (Popular Baseball Cap - Black)');
    console.log('─'.repeat(60));
    
    const specificProduct = await getInventory(token, '31-069-001');
    if (specificProduct) {
      analyzeInventoryStructure(specificProduct);
    }
    
    // Step 5: Get a broader sample of inventory
    console.log('\n' + '─'.repeat(60));
    console.log('FETCHING FULL INVENTORY SAMPLE');
    console.log('─'.repeat(60));
    
    const fullInventory = await getInventory(token);
    if (fullInventory) {
      // Just analyze structure, don't dump everything
      if (Array.isArray(fullInventory)) {
        console.log(`\n📊 Total products in inventory: ${fullInventory.length}`);
        
        // Look for patterns in SKUs
        const skuPatterns = new Map<string, number>();
        const productTypes = new Set<string>();
        
        fullInventory.forEach((item: any) => {
          const sku = item.sku || item.SKU || '';
          // Extract prefix pattern (first part before dash or first 2-3 chars)
          const match = sku.match(/^(\d+)/);
          if (match) {
            const prefix = match[1];
            skuPatterns.set(prefix, (skuPatterns.get(prefix) || 0) + 1);
          }
          
          // Look for any category/type fields
          if (item.category) productTypes.add(item.category);
          if (item.product_type) productTypes.add(item.product_type);
          if (item.type) productTypes.add(item.type);
        });
        
        console.log('\n📋 SKU Prefix Patterns (first 20):');
        const sortedPatterns = [...skuPatterns.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20);
        sortedPatterns.forEach(([prefix, count]) => {
          console.log(`   ${prefix}: ${count} products`);
        });
        
        if (productTypes.size > 0) {
          console.log('\n🏷️ Product Types/Categories found:');
          productTypes.forEach(type => console.log(`   - ${type}`));
        } else {
          console.log('\n⚠️ No category/type fields found in inventory data');
        }
        
        // Show a few diverse products
        console.log('\n📦 Sample of 5 diverse products:');
        const sampleIndices = [0, Math.floor(fullInventory.length * 0.25), Math.floor(fullInventory.length * 0.5), Math.floor(fullInventory.length * 0.75), fullInventory.length - 1];
        sampleIndices.forEach(index => {
          const item = fullInventory[index];
          if (item) {
            console.log(`\n   [${index}] ${JSON.stringify(item, null, 2).split('\n').slice(0, 15).join('\n')}...`);
          }
        });
      }
    }
    
    // Step 6: Get customer info (needed for orders)
    await getCustomerList(token);
    
    console.log('\n' + '═'.repeat(60));
    console.log('                    EXPLORATION COMPLETE');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
