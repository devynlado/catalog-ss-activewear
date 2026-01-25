/**
 * Popular Products Configuration
 * 
 * This file contains the curated list of popular products organized by:
 * - Category (for main navigation filtering)
 * - Sub-attributes (collar, sleeve, fit, gender for attribute filtering)
 * - Tier (bestseller, staff-pick, value, streetwear)
 * 
 * Total: ~335+ products covering all filter combinations
 * Expanded based on competitor research (JiffyShirts, BlankStyle, BulkApparel, ShirtSpace)
 * 
 * Premium Brands Featured: Bella+Canvas, Next Level, Comfort Colors, Champion,
 * Independent Trading Co, Lane Seven, Shaka Wear, Yupoong, Los Angeles Apparel
 * 
 * Value Brands Featured: Gildan, Hanes, Jerzees, Fruit of the Loom, Tultex,
 * Port & Company, A4, Augusta, Outdoor Cap, Sportsman
 * 
 * To update: Simply add/remove entries from the POPULAR_PRODUCTS array.
 * The styleNumber is the primary identifier (e.g., "3001", "G500").
 */

export type ProductTier = 'bestseller' | 'staff-pick' | 'value' | 'streetwear';

export type ProductCategory = 
  | 't-shirts'
  | 'long-sleeve'
  | 'tank-tops'
  | 'crewneck'
  | 'hoodies'
  | 'zip-hoodies'
  | 'quarter-zip'
  | 'polos'
  | 'performance'
  | 'headwear'
  | 'outerwear'
  | 'youth'
  | 'womens';

export interface PopularProduct {
  styleNumber: string;      // Style number (e.g., "3001", "G500")
  brand: string;            // Brand name for display
  name: string;             // Product name
  tier: ProductTier;        // Tier classification
  category: ProductCategory; // Primary category
  attributes?: string[];    // Sub-attributes for filtering (e.g., ["v-neck", "fitted", "womens"])
  note?: string;            // Internal note (why it's featured)
}

// ============================================================================
// POPULAR PRODUCTS LIST (~335+ products)
// Expanded based on competitor research (JiffyShirts, BlankStyle, BulkApparel, ShirtSpace)
// ============================================================================

export const POPULAR_PRODUCTS: PopularProduct[] = [
  // ==========================================================================
  // T-SHIRTS - SHORT SLEEVE (~60 products)
  // ==========================================================================
  
  // Bestsellers - Industry Standards (verified top sellers across competitors)
  { styleNumber: 'G500', brand: 'Gildan', name: 'Heavy Cotton Tee', tier: 'bestseller', category: 't-shirts', note: '#1 industry workhorse, 50+ colors' },
  { styleNumber: '5000', brand: 'Gildan', name: 'Heavy Cotton Tee', tier: 'bestseller', category: 't-shirts', note: 'Same as G500' },
  { styleNumber: '3001', brand: 'Bella+Canvas', name: 'Unisex Jersey Tee', tier: 'bestseller', category: 't-shirts', note: '#1 retail-quality, 95+ colors, 10K+ reviews' },
  { styleNumber: '64000', brand: 'Gildan', name: 'Softstyle Tee', tier: 'bestseller', category: 't-shirts', note: 'Soft ring-spun, top seller' },
  { styleNumber: 'G640', brand: 'Gildan', name: 'Softstyle Tee', tier: 'bestseller', category: 't-shirts', note: 'Same as 64000' },
  { styleNumber: '3001CVC', brand: 'Bella+Canvas', name: 'Heather CVC Tee', tier: 'bestseller', category: 't-shirts', attributes: ['cvc'], note: '7000+ reviews, very soft heather' },
  { styleNumber: '202', brand: 'Tultex', name: 'Unisex Fine Jersey Tee', tier: 'bestseller', category: 't-shirts', note: 'Popular budget premium, 50+ colors' },
  { styleNumber: '541', brand: 'Tultex', name: 'Premium Cotton Tee', tier: 'staff-pick', category: 't-shirts', note: 'Quality Tultex option' },
  
  // Staff Picks - Quality Recommendations
  { styleNumber: '3600', brand: 'Next Level', name: 'Cotton Crew', tier: 'staff-pick', category: 't-shirts', note: 'Soft, great for DTG' },
  { styleNumber: '6210', brand: 'Next Level', name: 'CVC Crew', tier: 'staff-pick', category: 't-shirts', attributes: ['cvc', 'tri-blend'], note: 'Premium soft feel' },
  { styleNumber: 'H000', brand: 'Gildan', name: 'Hammer Tee', tier: 'staff-pick', category: 't-shirts', note: 'Fashion fit, side seams' },
  { styleNumber: '2000', brand: 'Gildan', name: 'Ultra Cotton Tee', tier: 'staff-pick', category: 't-shirts', note: 'Classic heavyweight' },
  { styleNumber: '5180', brand: 'Hanes', name: 'Beefy-T', tier: 'staff-pick', category: 't-shirts', note: 'Durable heavyweight' },
  { styleNumber: '5280', brand: 'Hanes', name: 'ComfortSoft Tee', tier: 'staff-pick', category: 't-shirts', note: 'Soft essential tee' },
  { styleNumber: '29M', brand: 'Jerzees', name: 'DRI-POWER Active Tee', tier: 'staff-pick', category: 't-shirts', attributes: ['moisture-wicking'], note: 'Moisture-wicking value' },
  { styleNumber: '5250', brand: 'Hanes', name: 'Tagless Tee', tier: 'staff-pick', category: 't-shirts', note: 'No-tag comfort' },
  { styleNumber: '3930R', brand: 'Fruit of the Loom', name: 'Heavy Cotton Tee', tier: 'staff-pick', category: 't-shirts', note: 'Budget heavyweight, ~$2' },
  
  // Streetwear - Trendy/Premium (Shaka, Lane Seven, LA Apparel, Comfort Colors)
  { styleNumber: 'C1717', brand: 'Comfort Colors', name: 'Heavyweight Tee', tier: 'streetwear', category: 't-shirts', attributes: ['garment-dyed'], note: 'Garment-dyed trend leader' },
  { styleNumber: '1717', brand: 'Comfort Colors', name: 'Heavyweight Tee', tier: 'streetwear', category: 't-shirts', attributes: ['garment-dyed'], note: 'Same as C1717' },
  { styleNumber: '1301', brand: 'Alstyle', name: 'Classic Tee', tier: 'streetwear', category: 't-shirts', note: 'LA streetwear staple' },
  { styleNumber: 'SHGD', brand: 'Shaka Wear', name: 'Garment Dyed Tee', tier: 'streetwear', category: 't-shirts', attributes: ['garment-dyed', 'oversized'], note: 'Heavyweight, boxy fit' },
  { styleNumber: '1801', brand: 'Los Angeles Apparel', name: 'Garment Dyed Tee', tier: 'streetwear', category: 't-shirts', attributes: ['garment-dyed'], note: 'Made in LA' },
  { styleNumber: 'LS10001', brand: 'Lane Seven', name: 'Unisex Vintage Tee', tier: 'streetwear', category: 't-shirts', attributes: ['garment-dyed'], note: 'Premium streetwear brand' },
  { styleNumber: 'LS15000', brand: 'Lane Seven', name: 'Unisex Premium Tee', tier: 'streetwear', category: 't-shirts', note: 'Lane Seven premium cotton' },
  { styleNumber: 'SHASS', brand: 'Shaka Wear', name: 'Active Short Sleeve', tier: 'streetwear', category: 't-shirts', note: 'Shaka athletic style' },
  { styleNumber: 'SHMHSS', brand: 'Shaka Wear', name: 'Max Heavyweight Tee', tier: 'streetwear', category: 't-shirts', attributes: ['oversized'], note: '7.5oz super heavyweight' },
  { styleNumber: '1801GD', brand: 'Los Angeles Apparel', name: '6.5oz Garment Dye', tier: 'streetwear', category: 't-shirts', attributes: ['garment-dyed'], note: 'LA Apparel signature' },
  { styleNumber: '20001', brand: 'Los Angeles Apparel', name: 'Fine Jersey Tee', tier: 'streetwear', category: 't-shirts', note: 'LA Apparel fine jersey' },
  { styleNumber: '1801PRN', brand: 'Los Angeles Apparel', name: 'Premium Tee', tier: 'streetwear', category: 't-shirts', note: 'Premium LA made' },
  
  // Value - Budget Friendly
  { styleNumber: '5170', brand: 'Hanes', name: 'EcoSmart Tee', tier: 'value', category: 't-shirts', attributes: ['eco'], note: 'Budget eco-friendly' },
  { styleNumber: '980', brand: 'Anvil', name: 'Lightweight Tee', tier: 'value', category: 't-shirts', note: 'Ultra-light, cheap' },
  { styleNumber: 'G800', brand: 'Gildan', name: 'DryBlend Tee', tier: 'value', category: 't-shirts', attributes: ['moisture-wicking'], note: '50/50 blend value' },
  { styleNumber: '8000', brand: 'Gildan', name: 'DryBlend Tee', tier: 'value', category: 't-shirts', attributes: ['moisture-wicking'], note: 'Same as G800' },
  { styleNumber: '4980', brand: 'Hanes', name: 'Nano-T', tier: 'value', category: 't-shirts', note: 'Lightweight soft value' },
  { styleNumber: 'T425', brand: 'Hanes', name: 'Cool DRI', tier: 'value', category: 't-shirts', attributes: ['moisture-wicking'], note: 'Performance value' },
  
  // V-Neck T-Shirts
  { styleNumber: '3005', brand: 'Bella+Canvas', name: 'Unisex V-Neck', tier: 'bestseller', category: 't-shirts', attributes: ['v-neck'], note: 'Best-selling v-neck' },
  { styleNumber: '6240', brand: 'Next Level', name: 'CVC V-Neck', tier: 'staff-pick', category: 't-shirts', attributes: ['v-neck', 'cvc'], note: 'Premium v-neck' },
  { styleNumber: '64V00', brand: 'Gildan', name: 'Softstyle V-Neck', tier: 'value', category: 't-shirts', attributes: ['v-neck'], note: 'Budget v-neck' },
  { styleNumber: '982', brand: 'Anvil', name: 'Lightweight V-Neck', tier: 'value', category: 't-shirts', attributes: ['v-neck'], note: 'Lightweight v-neck' },
  { styleNumber: '3200', brand: 'Next Level', name: 'Cotton V-Neck', tier: 'staff-pick', category: 't-shirts', attributes: ['v-neck'], note: 'Quality cotton v-neck' },
  
  // Pocket Tees
  { styleNumber: 'G530', brand: 'Gildan', name: 'Heavy Cotton Pocket Tee', tier: 'bestseller', category: 't-shirts', attributes: ['pocket'], note: 'Classic pocket tee' },
  { styleNumber: '5300', brand: 'Gildan', name: 'Heavy Cotton Pocket Tee', tier: 'bestseller', category: 't-shirts', attributes: ['pocket'], note: 'Same as G530' },
  { styleNumber: '5590', brand: 'Hanes', name: 'Tagless Pocket Tee', tier: 'value', category: 't-shirts', attributes: ['pocket'], note: 'Budget pocket tee' },
  { styleNumber: '6030', brand: 'Comfort Colors', name: 'Pocket Tee', tier: 'streetwear', category: 't-shirts', attributes: ['pocket', 'garment-dyed'], note: 'Garment dyed pocket' },
  { styleNumber: '3021', brand: 'Bella+Canvas', name: 'Jersey Pocket Tee', tier: 'staff-pick', category: 't-shirts', attributes: ['pocket'], note: 'Soft pocket tee' },
  
  // Henley T-Shirts
  { styleNumber: '3979', brand: 'Bella+Canvas', name: 'Unisex Henley', tier: 'staff-pick', category: 't-shirts', attributes: ['henley'], note: 'Fashion henley' },
  
  // Tri-Blend T-Shirts
  { styleNumber: '3413', brand: 'Bella+Canvas', name: 'Triblend Tee', tier: 'bestseller', category: 't-shirts', attributes: ['tri-blend'], note: 'Ultra-soft triblend, 55 colors' },
  { styleNumber: '6010', brand: 'Next Level', name: 'Triblend Crew', tier: 'staff-pick', category: 't-shirts', attributes: ['tri-blend'], note: 'Premium triblend' },
  { styleNumber: '6750', brand: 'Gildan', name: 'Triblend Tee', tier: 'staff-pick', category: 't-shirts', attributes: ['tri-blend'], note: 'Gildan triblend bestseller' },
  { styleNumber: '6752', brand: 'Anvil', name: 'Triblend V-Neck', tier: 'staff-pick', category: 't-shirts', attributes: ['tri-blend', 'v-neck'], note: 'Triblend v-neck' },
  
  // Fitted/Slim T-Shirts
  { styleNumber: '6200', brand: 'Next Level', name: 'Poly/Cotton Crew', tier: 'staff-pick', category: 't-shirts', attributes: ['fitted'], note: 'Slim modern fit' },
  
  // Oversized/Relaxed T-Shirts
  { styleNumber: 'Max-T', brand: 'Shaka Wear', name: 'Max Heavyweight', tier: 'streetwear', category: 't-shirts', attributes: ['oversized'], note: 'Super heavyweight boxy' },
  { styleNumber: '1778', brand: 'Comfort Colors', name: 'Pigment Dyed Tee', tier: 'streetwear', category: 't-shirts', attributes: ['garment-dyed'], note: 'Pigment dyed vintage' },
  
  // Ringer T-Shirts
  { styleNumber: '3604', brand: 'Next Level', name: 'Ringer Tee', tier: 'staff-pick', category: 't-shirts', attributes: ['ringer'], note: 'Retro ringer style' },
  { styleNumber: '3055', brand: 'Bella+Canvas', name: 'Ringer Tee', tier: 'staff-pick', category: 't-shirts', attributes: ['ringer'], note: 'Bella ringer option' },
  
  // ==========================================================================
  // LONG SLEEVE T-SHIRTS (~25 products)
  // ==========================================================================
  
  { styleNumber: '5400', brand: 'Gildan', name: 'Heavy Cotton LS', tier: 'bestseller', category: 'long-sleeve', note: 'Classic workhorse' },
  { styleNumber: 'G540', brand: 'Gildan', name: 'Heavy Cotton LS', tier: 'bestseller', category: 'long-sleeve', note: 'Same as 5400' },
  { styleNumber: '3501', brand: 'Bella+Canvas', name: 'Jersey LS', tier: 'bestseller', category: 'long-sleeve', note: 'Soft, retail feel' },
  { styleNumber: '2400', brand: 'Gildan', name: 'Ultra Cotton LS', tier: 'staff-pick', category: 'long-sleeve', note: 'Budget classic' },
  { styleNumber: '6014', brand: 'Comfort Colors', name: 'Garment Dyed LS', tier: 'streetwear', category: 'long-sleeve', attributes: ['garment-dyed'], note: 'Trendy vintage look' },
  { styleNumber: '5186', brand: 'Hanes', name: 'Beefy LS', tier: 'value', category: 'long-sleeve', note: 'Durable budget option' },
  { styleNumber: '5596', brand: 'Hanes', name: 'Tagless LS', tier: 'value', category: 'long-sleeve', note: 'Tagless comfort' },
  { styleNumber: '3911', brand: 'Bella+Canvas', name: 'Triblend LS', tier: 'staff-pick', category: 'long-sleeve', attributes: ['tri-blend'], note: 'Soft triblend' },
  { styleNumber: '6211', brand: 'Next Level', name: 'CVC LS', tier: 'staff-pick', category: 'long-sleeve', attributes: ['cvc'], note: 'Premium soft LS' },
  { styleNumber: '6071', brand: 'Comfort Colors', name: 'Heavyweight LS', tier: 'streetwear', category: 'long-sleeve', note: 'Heavyweight vintage' },
  { styleNumber: 'LS10001LS', brand: 'Lane Seven', name: 'Vintage LS', tier: 'streetwear', category: 'long-sleeve', attributes: ['garment-dyed'], note: 'Lane Seven long sleeve' },
  { styleNumber: 'SHLS', brand: 'Shaka Wear', name: 'Max Heavyweight LS', tier: 'streetwear', category: 'long-sleeve', attributes: ['oversized'], note: 'Shaka heavyweight LS' },
  { styleNumber: '64400', brand: 'Gildan', name: 'Softstyle LS', tier: 'staff-pick', category: 'long-sleeve', note: 'Softstyle long sleeve' },
  { styleNumber: '4930', brand: 'Fruit of the Loom', name: 'HD Cotton LS', tier: 'value', category: 'long-sleeve', note: 'Budget long sleeve' },
  { styleNumber: '784AN', brand: 'Anvil', name: 'Midweight LS', tier: 'value', category: 'long-sleeve', note: 'Anvil long sleeve' },
  
  // 3/4 Sleeve & Baseball
  { styleNumber: '3200', brand: 'Bella+Canvas', name: 'Baseball Raglan', tier: 'bestseller', category: 'long-sleeve', attributes: ['3/4-sleeve'], note: 'Raglan baseball, popular' },
  { styleNumber: '6051', brand: 'Next Level', name: 'Triblend 3/4 Raglan', tier: 'staff-pick', category: 'long-sleeve', attributes: ['3/4-sleeve', 'tri-blend'], note: 'Soft raglan' },
  { styleNumber: '5700', brand: 'Gildan', name: 'Heavy Cotton Baseball', tier: 'value', category: 'long-sleeve', attributes: ['3/4-sleeve'], note: 'Budget raglan' },
  { styleNumber: '3352', brand: 'Bella+Canvas', name: 'Jersey Baseball Tee', tier: 'staff-pick', category: 'long-sleeve', attributes: ['3/4-sleeve'], note: 'Contrasting sleeve' },
  
  // Performance Long Sleeve
  { styleNumber: 'ST350LS', brand: 'Sport-Tek', name: 'PosiCharge LS', tier: 'bestseller', category: 'long-sleeve', attributes: ['moisture-wicking'], note: 'Top performance LS' },
  { styleNumber: 'N3165', brand: 'A4', name: 'Cooling Performance LS', tier: 'value', category: 'long-sleeve', attributes: ['moisture-wicking'], note: 'Budget performance LS' },
  { styleNumber: '482L', brand: 'Hanes', name: 'Cool DRI LS', tier: 'value', category: 'long-sleeve', attributes: ['moisture-wicking'], note: 'Hanes performance LS' },
  
  // ==========================================================================
  // TANK TOPS (~20 products)
  // ==========================================================================
  
  // Unisex Tanks
  { styleNumber: '2200', brand: 'Gildan', name: 'Ultra Cotton Tank', tier: 'bestseller', category: 'tank-tops', note: 'Classic unisex bestseller' },
  { styleNumber: 'G220', brand: 'Gildan', name: 'Ultra Cotton Tank', tier: 'bestseller', category: 'tank-tops', note: 'Same as 2200' },
  { styleNumber: '3480', brand: 'Bella+Canvas', name: 'Unisex Jersey Tank', tier: 'bestseller', category: 'tank-tops', note: 'Soft fashion fit' },
  { styleNumber: '986', brand: 'Anvil', name: 'Lightweight Tank', tier: 'value', category: 'tank-tops', note: 'Budget option' },
  { styleNumber: 'C9360', brand: 'Comfort Colors', name: 'Garment Dyed Tank', tier: 'streetwear', category: 'tank-tops', attributes: ['garment-dyed'], note: 'Vintage look' },
  { styleNumber: '9360', brand: 'Comfort Colors', name: 'Garment Dyed Tank', tier: 'streetwear', category: 'tank-tops', attributes: ['garment-dyed'], note: 'Same as C9360' },
  { styleNumber: '3633', brand: 'Next Level', name: 'Cotton Tank', tier: 'staff-pick', category: 'tank-tops', note: 'Premium unisex' },
  { styleNumber: '6333', brand: 'Next Level', name: 'Muscle Tank', tier: 'streetwear', category: 'tank-tops', attributes: ['muscle'], note: 'Muscle tank style' },
  { styleNumber: '3483', brand: 'Bella+Canvas', name: 'Unisex Jersey Muscle', tier: 'streetwear', category: 'tank-tops', attributes: ['muscle'], note: 'Relaxed muscle tank' },
  { styleNumber: 'SHTANK', brand: 'Shaka Wear', name: 'Heavyweight Tank', tier: 'streetwear', category: 'tank-tops', note: 'Shaka heavyweight tank' },
  
  // Womens Tanks & Racerbacks
  { styleNumber: '6733', brand: 'Next Level', name: 'Tri-Blend Racerback', tier: 'bestseller', category: 'tank-tops', attributes: ['womens', 'racerback'], note: 'Womens favorite, 20 colors' },
  { styleNumber: '1533', brand: 'Next Level', name: 'Ideal Racerback', tier: 'bestseller', category: 'tank-tops', attributes: ['womens', 'racerback'], note: 'Flattering fit, 25 colors' },
  { styleNumber: '6008', brand: 'Bella+Canvas', name: 'Jersey Racerback', tier: 'staff-pick', category: 'tank-tops', attributes: ['womens', 'racerback'], note: 'Soft racerback' },
  { styleNumber: '8430', brand: 'Bella+Canvas', name: 'Flowy Racerback', tier: 'streetwear', category: 'tank-tops', attributes: ['womens', 'flowy'], note: 'Trendy flowy fit' },
  { styleNumber: '8800', brand: 'Bella+Canvas', name: 'Flowy Muscle Tank', tier: 'streetwear', category: 'tank-tops', attributes: ['womens', 'flowy'], note: 'Relaxed muscle' },
  { styleNumber: '5033', brand: 'Next Level', name: 'Festival Tank', tier: 'streetwear', category: 'tank-tops', attributes: ['womens', 'cropped'], note: 'Festival crop style, 15 colors' },
  { styleNumber: '6682', brand: 'Next Level', name: 'Racerback Cropped Tank', tier: 'streetwear', category: 'tank-tops', attributes: ['womens', 'cropped'], note: 'Cropped racerback' },
  { styleNumber: '4000', brand: 'Bella+Canvas', name: 'Womens Baby Rib Tank', tier: 'staff-pick', category: 'tank-tops', attributes: ['womens'], note: 'Fitted baby rib' },
  
  // Performance Tanks
  { styleNumber: 'ST356', brand: 'Sport-Tek', name: 'PosiCharge Competitor Tank', tier: 'staff-pick', category: 'tank-tops', attributes: ['moisture-wicking'], note: 'Performance tank' },
  { styleNumber: 'LST356', brand: 'Sport-Tek', name: 'Ladies Competitor Tank', tier: 'staff-pick', category: 'tank-tops', attributes: ['womens', 'moisture-wicking'], note: 'Womens performance tank' },
  
  // ==========================================================================
  // CREWNECK SWEATSHIRTS (~22 products)
  // ==========================================================================
  
  // Bestsellers
  { styleNumber: '18000', brand: 'Gildan', name: 'Heavy Blend Crew', tier: 'bestseller', category: 'crewneck', note: '#1 crewneck, 30+ colors' },
  { styleNumber: 'G180', brand: 'Gildan', name: 'Heavy Blend Crew', tier: 'bestseller', category: 'crewneck', note: 'Same as 18000' },
  { styleNumber: '3901', brand: 'Bella+Canvas', name: 'Sponge Fleece Crew', tier: 'bestseller', category: 'crewneck', note: 'Soft, modern fit' },
  { styleNumber: 'SS3000', brand: 'Independent', name: 'Midweight Crew', tier: 'bestseller', category: 'crewneck', note: 'Streetwear favorite' },
  
  // Staff Picks
  { styleNumber: 'F260', brand: 'Hanes', name: 'Ultimate Cotton Crew', tier: 'staff-pick', category: 'crewneck', note: 'Budget quality' },
  { styleNumber: 'PC78', brand: 'Port & Company', name: 'Core Fleece Crew', tier: 'staff-pick', category: 'crewneck', note: 'Solid option' },
  { styleNumber: 'S600', brand: 'Champion', name: 'Powerblend Crew', tier: 'staff-pick', category: 'crewneck', note: 'Heritage brand quality' },
  { styleNumber: '562', brand: 'Jerzees', name: 'NuBlend Crew', tier: 'staff-pick', category: 'crewneck', note: 'Soft fleece' },
  { styleNumber: '9001', brand: 'Comfort Colors', name: 'Ring-Spun Crew', tier: 'staff-pick', category: 'crewneck', note: 'Premium comfort' },
  
  // Streetwear
  { styleNumber: '1566', brand: 'Comfort Colors', name: 'Garment Dyed Crew', tier: 'streetwear', category: 'crewneck', attributes: ['garment-dyed'], note: 'Trending vintage look' },
  { styleNumber: 'S149', brand: 'Champion', name: 'Reverse Weave Crew', tier: 'streetwear', category: 'crewneck', note: 'Premium heritage' },
  { styleNumber: '1545', brand: 'Comfort Colors', name: 'Colorblast Crew', tier: 'streetwear', category: 'crewneck', attributes: ['garment-dyed'], note: 'Tie-dye trending' },
  { styleNumber: 'LS14004', brand: 'Lane Seven', name: 'Premium Crewneck', tier: 'streetwear', category: 'crewneck', note: 'Lane Seven premium' },
  { styleNumber: 'SHCREW', brand: 'Shaka Wear', name: 'Heavyweight Crewneck', tier: 'streetwear', category: 'crewneck', note: 'Shaka heavyweight' },
  { styleNumber: 'PRM3500', brand: 'Independent', name: 'Heavyweight Pigment Crew', tier: 'streetwear', category: 'crewneck', attributes: ['garment-dyed'], note: 'Premium pigment dyed' },
  
  // Value
  { styleNumber: 'P1607', brand: 'Hanes', name: 'EcoSmart Crew', tier: 'value', category: 'crewneck', attributes: ['eco'], note: 'Eco-friendly budget' },
  { styleNumber: '562M', brand: 'Jerzees', name: 'NuBlend Crew', tier: 'value', category: 'crewneck', note: 'Budget fleece' },
  { styleNumber: 'SF000', brand: 'Fruit of the Loom', name: 'Sofspun Crew', tier: 'value', category: 'crewneck', note: 'Soft budget option' },
  
  // Fitted/Cropped Crews
  { styleNumber: '7503', brand: 'Bella+Canvas', name: 'Cropped Crew', tier: 'streetwear', category: 'crewneck', attributes: ['womens', 'cropped'], note: 'Trendy cropped' },
  { styleNumber: '7511', brand: 'Bella+Canvas', name: 'Womens Sponge Crew', tier: 'staff-pick', category: 'crewneck', attributes: ['womens'], note: 'Womens fit crew' },
  
  // ==========================================================================
  // HOODIES - PULLOVER (~30 products)
  // ==========================================================================
  
  // Bestsellers - Industry Standards
  { styleNumber: '18500', brand: 'Gildan', name: 'Heavy Blend Hoodie', tier: 'bestseller', category: 'hoodies', note: '#1 budget hoodie, 40+ colors' },
  { styleNumber: 'G185', brand: 'Gildan', name: 'Heavy Blend Hoodie', tier: 'bestseller', category: 'hoodies', note: 'Same as 18500' },
  { styleNumber: 'IND4000', brand: 'Independent', name: 'Heavyweight Hoodie', tier: 'bestseller', category: 'hoodies', note: '10oz premium streetwear, top seller' },
  { styleNumber: 'SS4500', brand: 'Independent', name: 'Midweight Hoodie', tier: 'bestseller', category: 'hoodies', note: 'Quality mid-tier, budget friendly' },
  { styleNumber: '3719', brand: 'Bella+Canvas', name: 'Sponge Fleece Hoodie', tier: 'bestseller', category: 'hoodies', note: 'Soft, modern cut' },
  
  // Staff Picks
  { styleNumber: 'S700', brand: 'Champion', name: 'Powerblend Hoodie', tier: 'staff-pick', category: 'hoodies', note: 'Quality heritage brand' },
  { styleNumber: 'F170', brand: 'Hanes', name: 'Ultimate Cotton Hoodie', tier: 'staff-pick', category: 'hoodies', note: 'Durable classic' },
  { styleNumber: '996MR', brand: 'Jerzees', name: 'NuBlend Hoodie', tier: 'staff-pick', category: 'hoodies', note: 'Soft fleece' },
  { styleNumber: 'PC78H', brand: 'Port & Company', name: 'Core Fleece Hoodie', tier: 'staff-pick', category: 'hoodies', note: 'Corporate favorite' },
  { styleNumber: '9303', brand: 'Next Level', name: 'Unisex Pullover Hoodie', tier: 'staff-pick', category: 'hoodies', note: 'Next Level quality' },
  
  // Streetwear - Premium
  { styleNumber: 'S101', brand: 'Champion', name: 'Reverse Weave Hoodie', tier: 'streetwear', category: 'hoodies', note: 'Premium heritage brand' },
  { styleNumber: '1567', brand: 'Comfort Colors', name: 'Garment Dyed Hoodie', tier: 'streetwear', category: 'hoodies', attributes: ['garment-dyed'], note: 'Trending vintage' },
  { styleNumber: 'SS1000', brand: 'Independent', name: 'Legend Hoodie', tier: 'streetwear', category: 'hoodies', note: 'Heavyweight premium' },
  { styleNumber: 'LS14001', brand: 'Lane Seven', name: 'Premium Pullover Hoodie', tier: 'streetwear', category: 'hoodies', note: 'Lane Seven premium' },
  { styleNumber: 'LS14003', brand: 'Lane Seven', name: 'Vintage Heavyweight Hoodie', tier: 'streetwear', category: 'hoodies', attributes: ['garment-dyed'], note: 'Lane Seven vintage' },
  { styleNumber: 'SHHD', brand: 'Shaka Wear', name: 'Heavyweight Hoodie', tier: 'streetwear', category: 'hoodies', note: 'Shaka heavyweight' },
  { styleNumber: 'HF500', brand: 'Los Angeles Apparel', name: 'Fleece Hoodie', tier: 'streetwear', category: 'hoodies', note: 'LA Apparel hoodie' },
  { styleNumber: 'IND5000P', brand: 'Independent', name: 'Legend Premium Hoodie', tier: 'streetwear', category: 'hoodies', note: 'Premium Independent' },
  
  // Value - Budget Friendly
  { styleNumber: 'P170', brand: 'Hanes', name: 'EcoSmart Hoodie', tier: 'value', category: 'hoodies', attributes: ['eco'], note: 'Budget eco option' },
  { styleNumber: 'PF170', brand: 'Port & Company', name: 'Fleece Pullover', tier: 'value', category: 'hoodies', note: 'Corporate staple' },
  { styleNumber: 'SF500', brand: 'Fruit of the Loom', name: 'Sofspun Hoodie', tier: 'value', category: 'hoodies', note: 'Soft budget option' },
  { styleNumber: '996M', brand: 'Jerzees', name: 'NuBlend Fleece Hoodie', tier: 'value', category: 'hoodies', note: 'Budget fleece' },
  
  // Pocket Hoodies
  { styleNumber: 'SS4500P', brand: 'Independent', name: 'Midweight Pocket Hoodie', tier: 'staff-pick', category: 'hoodies', attributes: ['pocket'], note: 'Kangaroo pocket' },
  
  // Cropped & Womens Hoodies
  { styleNumber: '7502', brand: 'Bella+Canvas', name: 'Cropped Fleece Hoodie', tier: 'streetwear', category: 'hoodies', attributes: ['womens', 'cropped'], note: 'Trendy cropped' },
  { styleNumber: '7519', brand: 'Bella+Canvas', name: 'Womens Classic Hoodie', tier: 'staff-pick', category: 'hoodies', attributes: ['womens'], note: 'Womens fit hoodie' },
  { styleNumber: 'LST254', brand: 'Sport-Tek', name: 'Ladies Pullover Hoodie', tier: 'staff-pick', category: 'hoodies', attributes: ['womens'], note: 'Ladies athletic hoodie' },
  
  // ==========================================================================
  // ZIP-UP HOODIES (~10 products)
  // ==========================================================================
  
  { styleNumber: '18600', brand: 'Gildan', name: 'Heavy Blend Full Zip', tier: 'bestseller', category: 'zip-hoodies', note: 'Classic full zip' },
  { styleNumber: 'G186', brand: 'Gildan', name: 'Heavy Blend Full Zip', tier: 'bestseller', category: 'zip-hoodies', note: 'Same as 18600' },
  { styleNumber: '3739', brand: 'Bella+Canvas', name: 'Sponge Fleece Full Zip', tier: 'staff-pick', category: 'zip-hoodies', note: 'Soft modern fit' },
  { styleNumber: 'IND4000Z', brand: 'Independent', name: 'Heavyweight Full Zip', tier: 'streetwear', category: 'zip-hoodies', note: 'Premium option' },
  { styleNumber: '993MR', brand: 'Jerzees', name: 'NuBlend Full Zip', tier: 'value', category: 'zip-hoodies', note: 'Budget option' },
  { styleNumber: 'F280', brand: 'Hanes', name: 'Ultimate Cotton Full Zip', tier: 'value', category: 'zip-hoodies', note: 'Durable classic' },
  { styleNumber: 'SS4500Z', brand: 'Independent', name: 'Midweight Zip', tier: 'staff-pick', category: 'zip-hoodies', note: 'Quality mid-tier' },
  { styleNumber: 'PC78ZH', brand: 'Port & Company', name: 'Core Fleece Full Zip', tier: 'value', category: 'zip-hoodies', note: 'Budget classic' },
  { styleNumber: 'S800', brand: 'Champion', name: 'Powerblend Full Zip', tier: 'staff-pick', category: 'zip-hoodies', note: 'Heritage brand' },
  
  // ==========================================================================
  // QUARTER & HALF ZIP (~8 products)
  // ==========================================================================
  
  { styleNumber: 'ST253', brand: 'Sport-Tek', name: '1/4-Zip Sweatshirt', tier: 'bestseller', category: 'quarter-zip', note: 'Popular corporate' },
  { styleNumber: '995M', brand: 'Jerzees', name: 'NuBlend 1/4 Zip', tier: 'value', category: 'quarter-zip', note: 'Budget quarter-zip' },
  { styleNumber: '9359', brand: 'Charles River', name: 'Crosswind Quarter Zip', tier: 'staff-pick', category: 'quarter-zip', note: 'Quality pullover' },
  { styleNumber: 'F218', brand: 'Port Authority', name: 'Fleece 1/4-Zip', tier: 'staff-pick', category: 'quarter-zip', note: 'Corporate favorite' },
  { styleNumber: 'PC850Q', brand: 'Port & Company', name: 'Fan Favorite 1/4 Zip', tier: 'value', category: 'quarter-zip', note: 'Budget option' },
  { styleNumber: 'ST851', brand: 'Sport-Tek', name: 'Sport-Wick 1/4 Zip', tier: 'staff-pick', category: 'quarter-zip', attributes: ['moisture-wicking'], note: 'Performance quarter-zip' },
  
  // Half Zip
  { styleNumber: 'ST254', brand: 'Sport-Tek', name: '1/2 Zip Sweatshirt', tier: 'staff-pick', category: 'quarter-zip', attributes: ['half-zip'], note: 'Half-zip option' },
  { styleNumber: 'L224', brand: 'Port Authority', name: 'Microfleece 1/2 Zip', tier: 'staff-pick', category: 'quarter-zip', attributes: ['half-zip'], note: 'Lightweight half-zip' },
  
  // ==========================================================================
  // POLOS (~20 products)
  // ==========================================================================
  
  // Bestsellers
  { styleNumber: 'K500', brand: 'Port Authority', name: 'Silk Touch Polo', tier: 'bestseller', category: 'polos', note: 'Corporate standard, 25+ colors' },
  { styleNumber: '8800', brand: 'Gildan', name: 'DryBlend Jersey Polo', tier: 'bestseller', category: 'polos', note: 'Top seller, 20+ colors' },
  { styleNumber: 'G880', brand: 'Gildan', name: 'DryBlend Jersey Polo', tier: 'bestseller', category: 'polos', note: 'Same as 8800' },
  { styleNumber: 'K420', brand: 'Port Authority', name: 'Heavyweight Pique Polo', tier: 'bestseller', category: 'polos', note: 'Classic pique' },
  
  // Staff Picks
  { styleNumber: '82800', brand: 'Gildan', name: 'Premium Cotton Polo', tier: 'staff-pick', category: 'polos', note: 'Quality cotton' },
  { styleNumber: 'K110', brand: 'Port Authority', name: 'Dry Zone UV Polo', tier: 'staff-pick', category: 'polos', attributes: ['moisture-wicking'], note: 'UV performance' },
  { styleNumber: 'TK469', brand: 'Port Authority', name: 'Stretch Pique Polo', tier: 'staff-pick', category: 'polos', note: 'Modern stretch fit' },
  { styleNumber: 'K540', brand: 'Port Authority', name: 'Silk Touch Performance', tier: 'staff-pick', category: 'polos', attributes: ['moisture-wicking'], note: 'Premium performance' },
  { styleNumber: 'K571', brand: 'Port Authority', name: 'Rapid Dry Polo', tier: 'staff-pick', category: 'polos', attributes: ['moisture-wicking'], note: 'Quick-dry' },
  { styleNumber: 'K600', brand: 'Port Authority', name: 'EZPerformance Pique Polo', tier: 'staff-pick', category: 'polos', attributes: ['moisture-wicking'], note: 'EZ performance' },
  { styleNumber: 'ST650', brand: 'Sport-Tek', name: 'Micropique Polo', tier: 'staff-pick', category: 'polos', attributes: ['moisture-wicking'], note: 'Sport performance polo' },
  { styleNumber: 'ST630', brand: 'Sport-Tek', name: 'Embossed PosiCharge Polo', tier: 'staff-pick', category: 'polos', attributes: ['moisture-wicking'], note: 'Textured performance' },
  
  // Value
  { styleNumber: 'K100', brand: 'Port Authority', name: 'Core Classic Pique', tier: 'value', category: 'polos', note: 'Budget classic' },
  { styleNumber: '054', brand: 'Hanes', name: 'EcoSmart Jersey Polo', tier: 'value', category: 'polos', attributes: ['eco'], note: 'Eco budget' },
  { styleNumber: '436MP', brand: 'Jerzees', name: 'SpotShield Jersey Polo', tier: 'value', category: 'polos', note: 'Stain resistant' },
  { styleNumber: 'KP55', brand: 'Port & Company', name: 'Core Blend Pique', tier: 'value', category: 'polos', note: 'Budget blend polo' },
  
  // Womens Polos
  { styleNumber: 'L500', brand: 'Port Authority', name: 'Ladies Silk Touch Polo', tier: 'bestseller', category: 'polos', attributes: ['womens'], note: 'Womens corporate standard' },
  { styleNumber: 'L540', brand: 'Port Authority', name: 'Ladies Performance Polo', tier: 'staff-pick', category: 'polos', attributes: ['womens', 'moisture-wicking'], note: 'Womens performance' },
  { styleNumber: 'LK110', brand: 'Port Authority', name: 'Ladies Dry Zone UV Polo', tier: 'staff-pick', category: 'polos', attributes: ['womens', 'moisture-wicking'], note: 'Womens UV protection' },
  { styleNumber: 'L100', brand: 'Port Authority', name: 'Ladies Core Classic Pique', tier: 'value', category: 'polos', attributes: ['womens'], note: 'Womens budget polo' },
  
  // ==========================================================================
  // PERFORMANCE & ATHLETIC (~12 products)
  // ==========================================================================
  
  { styleNumber: 'ST350', brand: 'Sport-Tek', name: 'PosiCharge Competitor Tee', tier: 'bestseller', category: 'performance', attributes: ['moisture-wicking'], note: 'Top performance tee' },
  { styleNumber: 'N3142', brand: 'A4', name: 'Cooling Performance Tee', tier: 'value', category: 'performance', attributes: ['moisture-wicking'], note: 'Budget performance' },
  { styleNumber: 'G460', brand: 'Gildan', name: 'Performance Tee', tier: 'value', category: 'performance', attributes: ['moisture-wicking'], note: 'Gildan performance' },
  { styleNumber: '4820', brand: 'Hanes', name: 'Cool DRI Performance Tee', tier: 'value', category: 'performance', attributes: ['moisture-wicking'], note: 'Hanes performance' },
  { styleNumber: 'ST650', brand: 'Sport-Tek', name: 'Micropique Polo', tier: 'staff-pick', category: 'performance', attributes: ['moisture-wicking'], note: 'Performance polo' },
  { styleNumber: 'YST350', brand: 'Sport-Tek', name: 'Youth Competitor Tee', tier: 'value', category: 'performance', attributes: ['moisture-wicking', 'youth'], note: 'Youth performance' },
  
  // Performance Long Sleeve
  { styleNumber: 'ST350LS', brand: 'Sport-Tek', name: 'PosiCharge LS Tee', tier: 'staff-pick', category: 'performance', attributes: ['moisture-wicking'], note: 'Performance long sleeve' },
  
  // Performance Tanks
  { styleNumber: 'ST356', brand: 'Sport-Tek', name: 'PosiCharge Tank', tier: 'staff-pick', category: 'performance', attributes: ['moisture-wicking'], note: 'Performance tank' },
  
  // Performance Shorts
  { styleNumber: 'ST310', brand: 'Sport-Tek', name: 'Side Blocked Shorts', tier: 'staff-pick', category: 'performance', attributes: ['shorts'], note: 'Athletic shorts' },
  { styleNumber: '81622', brand: 'Champion', name: 'Long Mesh Shorts', tier: 'value', category: 'performance', attributes: ['shorts'], note: 'Classic gym shorts' },
  
  // ==========================================================================
  // HEADWEAR (~35 products)
  // ==========================================================================
  
  // Trucker Caps - Bestsellers
  { styleNumber: '112', brand: 'Richardson', name: 'Trucker Cap', tier: 'bestseller', category: 'headwear', attributes: ['trucker', '6-panel'], note: '#1 cap in USA, 50+ colors' },
  { styleNumber: '6606', brand: 'Yupoong', name: 'Retro Trucker', tier: 'bestseller', category: 'headwear', attributes: ['trucker', '6-panel'], note: 'Popular snapback, 11+ colors' },
  { styleNumber: '6606T', brand: 'Yupoong', name: 'Two-Tone Trucker', tier: 'staff-pick', category: 'headwear', attributes: ['trucker', '6-panel'], note: 'Two-tone trucker' },
  { styleNumber: '112FP', brand: 'Richardson', name: '5-Panel Trucker', tier: 'streetwear', category: 'headwear', attributes: ['trucker', '5-panel'], note: 'Trendy 5-panel' },
  { styleNumber: 'C112', brand: 'Port Authority', name: 'Snapback Trucker', tier: 'value', category: 'headwear', attributes: ['trucker', '6-panel'], note: 'Budget trucker' },
  { styleNumber: '112PM', brand: 'Richardson', name: 'Printed Mesh Trucker', tier: 'staff-pick', category: 'headwear', attributes: ['trucker'], note: 'Camo mesh options' },
  { styleNumber: '115', brand: 'Richardson', name: 'Low Pro Trucker', tier: 'staff-pick', category: 'headwear', attributes: ['trucker', '6-panel'], note: 'Low profile trucker' },
  { styleNumber: '111', brand: 'Richardson', name: 'Garment Washed Trucker', tier: 'streetwear', category: 'headwear', attributes: ['trucker'], note: 'Vintage washed' },
  { styleNumber: '5079', brand: 'Yupoong', name: 'Retro Golf Panel', tier: 'staff-pick', category: 'headwear', attributes: ['trucker', '5-panel'], note: 'Golf style trucker' },
  
  // Dad Hats / Unstructured
  { styleNumber: '6245CM', brand: 'Yupoong', name: 'Classic Dad Hat', tier: 'bestseller', category: 'headwear', attributes: ['unstructured'], note: 'Trendy dad hat' },
  { styleNumber: '320', brand: 'Richardson', name: 'Unstructured Cap', tier: 'staff-pick', category: 'headwear', attributes: ['unstructured'], note: 'Relaxed fit' },
  { styleNumber: '325', brand: 'Richardson', name: 'Garment Washed Dad Cap', tier: 'streetwear', category: 'headwear', attributes: ['unstructured'], note: 'Vintage dad hat' },
  { styleNumber: '2260', brand: 'Sportsman', name: 'Unstructured Cap', tier: 'value', category: 'headwear', attributes: ['unstructured'], note: 'Budget dad hat' },
  { styleNumber: 'CP80', brand: 'Port & Company', name: 'Twill Cap', tier: 'value', category: 'headwear', attributes: ['unstructured'], note: 'Budget adjustable' },
  { styleNumber: 'CP77', brand: 'Port & Company', name: 'Brushed Twill Cap', tier: 'value', category: 'headwear', attributes: ['unstructured'], note: 'Soft twill cap' },
  { styleNumber: '6997', brand: 'Yupoong', name: 'Garment Washed Cotton Dad', tier: 'streetwear', category: 'headwear', attributes: ['unstructured'], note: 'Washed cotton dad hat' },
  
  // Structured Caps & Flexfit
  { styleNumber: 'NE1000', brand: 'New Era', name: 'Structured Stretch', tier: 'staff-pick', category: 'headwear', attributes: ['structured'], note: 'Premium brand' },
  { styleNumber: 'NE1020', brand: 'New Era', name: 'Structured Flat Bill', tier: 'streetwear', category: 'headwear', attributes: ['structured', 'flat-bill'], note: 'New Era flat bill' },
  { styleNumber: '6277', brand: 'Yupoong', name: 'Flexfit Wooly Combed', tier: 'bestseller', category: 'headwear', attributes: ['flexfit'], note: 'Classic flexfit bestseller' },
  { styleNumber: '6511', brand: 'Yupoong', name: 'Flexfit Trucker Mesh', tier: 'staff-pick', category: 'headwear', attributes: ['flexfit', 'trucker'], note: 'Flexfit trucker' },
  { styleNumber: '6297', brand: 'Yupoong', name: 'Flexfit Triblend', tier: 'staff-pick', category: 'headwear', attributes: ['flexfit'], note: 'Soft triblend flexfit' },
  { styleNumber: '110', brand: 'Richardson', name: 'Pro Model Trucker', tier: 'staff-pick', category: 'headwear', attributes: ['structured', 'trucker'], note: 'Pro structured trucker' },
  
  // Snapbacks & Flat Bills
  { styleNumber: '6089', brand: 'Yupoong', name: 'Classic Snapback', tier: 'streetwear', category: 'headwear', attributes: ['snapback', 'flat-bill'], note: 'Classic flat bill snapback' },
  { styleNumber: '6007', brand: 'Yupoong', name: '5-Panel Snapback', tier: 'streetwear', category: 'headwear', attributes: ['snapback', '5-panel'], note: 'Trendy 5-panel' },
  { styleNumber: 'NE402', brand: 'New Era', name: 'Flat Bill Snapback', tier: 'streetwear', category: 'headwear', attributes: ['snapback', 'flat-bill'], note: 'New Era snapback' },
  
  // Beanies
  { styleNumber: 'YP019', brand: 'Yupoong', name: 'Cuffed Beanie', tier: 'bestseller', category: 'headwear', attributes: ['beanie'], note: 'Cold weather essential' },
  { styleNumber: '1501KC', brand: 'Yupoong', name: 'Heavyweight Beanie', tier: 'streetwear', category: 'headwear', attributes: ['beanie'], note: 'Thick premium beanie' },
  { styleNumber: 'SP12', brand: 'Sportsman', name: '12" Knit Beanie', tier: 'value', category: 'headwear', attributes: ['beanie'], note: 'Budget beanie' },
  { styleNumber: 'CP91', brand: 'Port & Company', name: 'Fleece-Lined Beanie', tier: 'value', category: 'headwear', attributes: ['beanie'], note: 'Warm fleece lined' },
  { styleNumber: 'CP90', brand: 'Port & Company', name: 'Knit Cuff Beanie', tier: 'value', category: 'headwear', attributes: ['beanie'], note: 'Budget cuffed beanie' },
  { styleNumber: '1545K', brand: 'Yupoong', name: 'Waffle Knit Beanie', tier: 'streetwear', category: 'headwear', attributes: ['beanie'], note: 'Trendy waffle knit' },
  
  // Bucket Hats & Visors
  { styleNumber: 'BX003', brand: 'Big Accessories', name: 'Bucket Hat', tier: 'streetwear', category: 'headwear', attributes: ['bucket'], note: 'Trendy bucket' },
  { styleNumber: 'BX005', brand: 'Big Accessories', name: 'Contrast Bucket', tier: 'streetwear', category: 'headwear', attributes: ['bucket'], note: 'Two-tone bucket hat' },
  { styleNumber: 'CP45', brand: 'Port & Company', name: 'Twill Visor', tier: 'value', category: 'headwear', attributes: ['visor'], note: 'Budget visor' },
  
  // ==========================================================================
  // OUTERWEAR (~10 products)
  // ==========================================================================
  
  { styleNumber: 'J317', brand: 'Port Authority', name: 'Soft Shell Jacket', tier: 'staff-pick', category: 'outerwear', note: 'Versatile corporate' },
  { styleNumber: 'J790', brand: 'Port Authority', name: 'Glacier Softshell', tier: 'staff-pick', category: 'outerwear', note: 'Performance shell' },
  { styleNumber: 'J706', brand: 'Port Authority', name: 'Textured Soft Shell', tier: 'bestseller', category: 'outerwear', note: 'Popular option' },
  { styleNumber: '8929', brand: 'DRI DUCK', name: 'Hooded Work Jacket', tier: 'value', category: 'outerwear', attributes: ['workwear'], note: 'Workwear staple' },
  { styleNumber: 'CO200', brand: 'Champion', name: 'Packable Jacket', tier: 'streetwear', category: 'outerwear', note: 'Lightweight trendy' },
  { styleNumber: 'J318', brand: 'Port Authority', name: 'Core Colorblock Soft Shell', tier: 'staff-pick', category: 'outerwear', note: 'Colorblock style' },
  { styleNumber: 'J768', brand: 'Port Authority', name: 'Endeavor Jacket', tier: 'staff-pick', category: 'outerwear', note: 'Premium corporate' },
  { styleNumber: 'JST72', brand: 'Sport-Tek', name: 'V-Neck Wind Shirt', tier: 'value', category: 'outerwear', note: 'Lightweight layer' },
  
  // Vests
  { styleNumber: 'J325', brand: 'Port Authority', name: 'Core Soft Shell Vest', tier: 'staff-pick', category: 'outerwear', attributes: ['vest'], note: 'Popular vest' },
  
  // ==========================================================================
  // YOUTH & KIDS (~12 products)
  // ==========================================================================
  
  // Youth T-Shirts
  { styleNumber: '5000B', brand: 'Gildan', name: 'Youth Heavy Cotton', tier: 'bestseller', category: 'youth', note: 'Youth workhorse' },
  { styleNumber: 'G500B', brand: 'Gildan', name: 'Youth Heavy Cotton', tier: 'bestseller', category: 'youth', note: 'Same as 5000B' },
  { styleNumber: '3001Y', brand: 'Bella+Canvas', name: 'Youth Jersey Tee', tier: 'staff-pick', category: 'youth', note: 'Soft youth tee' },
  { styleNumber: '5450', brand: 'Hanes', name: 'Youth Tagless Tee', tier: 'value', category: 'youth', note: 'Budget youth' },
  { styleNumber: '9018', brand: 'Comfort Colors', name: 'Youth Garment Dyed', tier: 'streetwear', category: 'youth', attributes: ['garment-dyed'], note: 'Trendy youth' },
  
  // Youth Hoodies & Fleece
  { styleNumber: '18500B', brand: 'Gildan', name: 'Youth Heavy Blend Hoodie', tier: 'bestseller', category: 'youth', note: 'Youth hoodie standard' },
  { styleNumber: 'P473', brand: 'Hanes', name: 'Youth EcoSmart Hoodie', tier: 'value', category: 'youth', attributes: ['eco'], note: 'Budget youth hoodie' },
  { styleNumber: '18000B', brand: 'Gildan', name: 'Youth Heavy Blend Crew', tier: 'bestseller', category: 'youth', note: 'Youth crewneck' },
  
  // Youth Performance
  { styleNumber: 'YST350', brand: 'Sport-Tek', name: 'Youth Competitor Tee', tier: 'staff-pick', category: 'youth', attributes: ['moisture-wicking'], note: 'Youth performance' },
  
  // Toddler & Infant
  { styleNumber: '5100P', brand: 'Gildan', name: 'Toddler Heavy Cotton', tier: 'value', category: 'youth', attributes: ['toddler'], note: 'Toddler tee' },
  { styleNumber: 'RS3321', brand: 'Rabbit Skins', name: 'Toddler Cotton Jersey Tee', tier: 'staff-pick', category: 'youth', attributes: ['toddler'], note: 'Soft toddler' },
  { styleNumber: 'RS3322', brand: 'Rabbit Skins', name: 'Infant Cotton Jersey Tee', tier: 'staff-pick', category: 'youth', attributes: ['infant'], note: 'Soft infant' },
  
  // ==========================================================================
  // WOMENS SPECIFIC (~15 products)
  // ==========================================================================
  
  // Womens T-Shirts
  { styleNumber: '6004', brand: 'Bella+Canvas', name: 'Womens Favorite Tee', tier: 'bestseller', category: 'womens', note: 'Flattering fit' },
  { styleNumber: '1510', brand: 'Next Level', name: 'Womens Ideal Tee', tier: 'staff-pick', category: 'womens', note: 'Soft fitted' },
  { styleNumber: '5000L', brand: 'Gildan', name: 'Ladies Heavy Cotton', tier: 'value', category: 'womens', note: 'Budget womens' },
  { styleNumber: '64000L', brand: 'Gildan', name: 'Ladies Softstyle', tier: 'value', category: 'womens', note: 'Soft value' },
  { styleNumber: '6710', brand: 'Next Level', name: 'Womens Triblend Tee', tier: 'staff-pick', category: 'womens', attributes: ['tri-blend'], note: 'Premium soft' },
  
  // Womens V-Necks
  { styleNumber: '6005', brand: 'Bella+Canvas', name: 'Womens Jersey V-Neck', tier: 'bestseller', category: 'womens', attributes: ['v-neck'], note: 'Popular v-neck' },
  { styleNumber: '1540', brand: 'Next Level', name: 'Womens Ideal V-Neck', tier: 'staff-pick', category: 'womens', attributes: ['v-neck'], note: 'Soft v-neck' },
  { styleNumber: 'G500VL', brand: 'Gildan', name: 'Ladies V-Neck', tier: 'value', category: 'womens', attributes: ['v-neck'], note: 'Budget v-neck' },
  
  // Womens Scoop & Fashion
  { styleNumber: '8816', brand: 'Bella+Canvas', name: 'Womens Slouchy Tee', tier: 'streetwear', category: 'womens', attributes: ['relaxed'], note: 'Trendy slouchy' },
  { styleNumber: '6008', brand: 'Bella+Canvas', name: 'Womens Jersey Racerback', tier: 'staff-pick', category: 'womens', attributes: ['racerback'], note: 'Active racerback' },
  
  // Womens Long Sleeve
  { styleNumber: '6500', brand: 'Bella+Canvas', name: 'Womens Jersey LS', tier: 'staff-pick', category: 'womens', note: 'Fitted long sleeve' },
  
  // Womens Fleece
  { styleNumber: 'L305', brand: 'Port Authority', name: 'Ladies Value Fleece Jacket', tier: 'value', category: 'womens', note: 'Budget fleece' },
  { styleNumber: '7501', brand: 'Bella+Canvas', name: 'Womens Sponge Fleece Hoodie', tier: 'staff-pick', category: 'womens', note: 'Soft womens hoodie' },
  
  // Cap Sleeve
  { styleNumber: '8703', brand: 'Bella+Canvas', name: 'Womens Flowy Muscle Tee', tier: 'streetwear', category: 'womens', attributes: ['cap-sleeve', 'flowy'], note: 'Trendy cap sleeve' },

  // ==========================================================================
  // ADDITIONAL BESTSELLERS - Expanded from Competitor Research
  // (JiffyShirts, BulkApparel, ShirtSpace top sellers)
  // ==========================================================================

  // Additional T-Shirts - High Volume Sellers
  { styleNumber: '241', brand: 'Tultex', name: 'Unisex Poly-Rich Tee', tier: 'value', category: 't-shirts', note: 'Tultex bestseller, soft poly blend' },
  { styleNumber: '254', brand: 'Tultex', name: 'Unisex Vintage Tee', tier: 'streetwear', category: 't-shirts', attributes: ['garment-dyed'], note: 'Vintage wash trend' },
  { styleNumber: '290', brand: 'Tultex', name: 'Unisex Jersey Tee', tier: 'value', category: 't-shirts', note: 'Budget-friendly basic' },
  { styleNumber: 'G270', brand: 'Gildan', name: 'DryBlend Adult Tee', tier: 'value', category: 't-shirts', attributes: ['moisture-wicking'], note: 'Moisture-wicking budget' },
  { styleNumber: '5170', brand: 'Hanes', name: 'EcoSmart 50/50 Tee', tier: 'value', category: 't-shirts', attributes: ['eco'], note: 'Recycled content' },
  { styleNumber: '5280', brand: 'Hanes', name: 'ComfortSoft Tagless Tee', tier: 'value', category: 't-shirts', note: 'Soft tagless comfort' },
  { styleNumber: '29MR', brand: 'Jerzees', name: 'DRI-POWER Active Tee', tier: 'value', category: 't-shirts', attributes: ['moisture-wicking'], note: 'Performance value' },
  { styleNumber: '363V', brand: 'Fruit of the Loom', name: 'HD Cotton V-Neck', tier: 'value', category: 't-shirts', attributes: ['v-neck'], note: 'Budget v-neck' },
  { styleNumber: '39VR', brand: 'Fruit of the Loom', name: 'HD Cotton V-Neck', tier: 'value', category: 't-shirts', attributes: ['v-neck'], note: 'Same as 363V' },

  // Additional Long Sleeve
  { styleNumber: '5586', brand: 'Hanes', name: 'ComfortSoft LS', tier: 'value', category: 'long-sleeve', note: 'Soft tagless LS' },
  { styleNumber: '4930R', brand: 'Fruit of the Loom', name: 'HD Cotton LS', tier: 'value', category: 'long-sleeve', note: 'Budget long sleeve' },
  { styleNumber: '29LSR', brand: 'Jerzees', name: 'DRI-POWER LS', tier: 'value', category: 'long-sleeve', attributes: ['moisture-wicking'], note: 'Performance LS value' },
  { styleNumber: '245', brand: 'Tultex', name: 'Unisex Fine Jersey LS', tier: 'value', category: 'long-sleeve', note: 'Tultex long sleeve' },

  // Additional Sweatshirts/Fleece
  { styleNumber: '12000', brand: 'Gildan', name: 'DryBlend Crewneck', tier: 'value', category: 'crewneck', note: 'Moisture-wicking fleece' },
  { styleNumber: 'G120', brand: 'Gildan', name: 'DryBlend Crewneck', tier: 'value', category: 'crewneck', note: 'Same as 12000' },
  { styleNumber: 'F260', brand: 'Hanes', name: 'PrintPro Sweatshirt', tier: 'value', category: 'crewneck', note: 'Print-ready fleece' },
  { styleNumber: '562', brand: 'Jerzees', name: 'NuBlend Crewneck', tier: 'value', category: 'crewneck', note: 'Soft budget fleece' },
  { styleNumber: 'SF72R', brand: 'Fruit of the Loom', name: 'Sofspun Crewneck', tier: 'value', category: 'crewneck', note: 'Budget soft fleece' },
  { styleNumber: '580', brand: 'Jerzees', name: 'NuBlend Cadet Collar', tier: 'staff-pick', category: 'quarter-zip', note: 'Cadet collar style' },

  // Additional Hoodies
  { styleNumber: '12500', brand: 'Gildan', name: 'DryBlend Hoodie', tier: 'value', category: 'hoodies', note: 'Moisture-wicking hoodie' },
  { styleNumber: 'G125', brand: 'Gildan', name: 'DryBlend Hoodie', tier: 'value', category: 'hoodies', note: 'Same as 12500' },
  { styleNumber: 'P998', brand: 'Hanes', name: 'EcoSmart Pullover Hoodie', tier: 'value', category: 'hoodies', attributes: ['eco'], note: 'Eco hoodie' },
  { styleNumber: '996', brand: 'Jerzees', name: 'NuBlend Pullover Hood', tier: 'value', category: 'hoodies', note: 'Budget fleece hood' },
  { styleNumber: 'SF76R', brand: 'Fruit of the Loom', name: 'Sofspun Hoodie', tier: 'value', category: 'hoodies', note: 'Soft budget hoodie' },
  { styleNumber: 'IND4000C', brand: 'Independent', name: 'Heavyweight Cross-Grain', tier: 'streetwear', category: 'hoodies', note: 'Premium cross-grain' },
  { styleNumber: 'PRM4500', brand: 'Independent', name: 'Pigment Dyed Hoodie', tier: 'streetwear', category: 'hoodies', attributes: ['garment-dyed'], note: 'Pigment dyed premium' },

  // Additional Zip Hoodies
  { styleNumber: '993', brand: 'Jerzees', name: 'NuBlend Full Zip', tier: 'value', category: 'zip-hoodies', note: 'Budget full zip' },
  { styleNumber: 'SF73R', brand: 'Fruit of the Loom', name: 'Sofspun Full Zip', tier: 'value', category: 'zip-hoodies', note: 'Budget soft zip' },
  { styleNumber: 'N280', brand: 'Hanes', name: 'Nano Full Zip Hoodie', tier: 'value', category: 'zip-hoodies', note: 'Lightweight zip' },

  // Additional Performance & Athletic
  { styleNumber: 'N3165', brand: 'A4', name: 'Cooling Performance LS Tee', tier: 'value', category: 'performance', attributes: ['moisture-wicking'], note: 'Budget performance LS' },
  { styleNumber: 'N3184', brand: 'A4', name: 'Shorts Sleeve Cooling Tee', tier: 'value', category: 'performance', attributes: ['moisture-wicking'], note: 'Cooling performance' },
  { styleNumber: 'N3293', brand: 'A4', name: 'Sprint Performance Tee', tier: 'value', category: 'performance', attributes: ['moisture-wicking'], note: 'Sprint athletic tee' },
  { styleNumber: '790', brand: 'Augusta', name: 'Wicking T-Shirt', tier: 'value', category: 'performance', attributes: ['moisture-wicking'], note: 'Augusta performance tee' },
  { styleNumber: '791', brand: 'Augusta', name: 'Wicking T-Shirt Youth', tier: 'value', category: 'performance', attributes: ['moisture-wicking', 'youth'], note: 'Youth performance' },
  { styleNumber: '215', brand: 'Augusta', name: 'Reversible Practice Jersey', tier: 'staff-pick', category: 'performance', note: 'Practice jersey' },
  { styleNumber: 'ST340', brand: 'Sport-Tek', name: 'RacerMesh Tee', tier: 'staff-pick', category: 'performance', attributes: ['moisture-wicking'], note: 'Breathable mesh tee' },
  { styleNumber: 'ST360', brand: 'Sport-Tek', name: 'Heather Contender Tee', tier: 'staff-pick', category: 'performance', attributes: ['moisture-wicking'], note: 'Heather performance' },
  { styleNumber: 'CW22', brand: 'Champion', name: 'Double Dry Performance Tee', tier: 'staff-pick', category: 'performance', attributes: ['moisture-wicking'], note: 'Champion performance' },
  { styleNumber: 'T525C', brand: 'Champion', name: 'Double Dry Eco Tee', tier: 'value', category: 'performance', attributes: ['moisture-wicking', 'eco'], note: 'Eco performance' },

  // Additional Headwear - Caps & Hats
  { styleNumber: '112FP-R', brand: 'Richardson', name: 'Five Panel Trucker', tier: 'streetwear', category: 'headwear', attributes: ['trucker', '5-panel'], note: '5-panel alternative' },
  { styleNumber: '115', brand: 'Richardson', name: 'Low Profile Trucker', tier: 'staff-pick', category: 'headwear', attributes: ['trucker'], note: 'Low pro style' },
  { styleNumber: '172', brand: 'Richardson', name: 'Fitted Pulse Cap', tier: 'staff-pick', category: 'headwear', attributes: ['structured'], note: 'Fitted alternative' },
  { styleNumber: '514', brand: 'Richardson', name: 'Surge Adjustable Cap', tier: 'staff-pick', category: 'headwear', attributes: ['structured'], note: 'Adjustable performance' },
  { styleNumber: '6789', brand: 'Yupoong', name: 'Premium Curved Visor Snapback', tier: 'staff-pick', category: 'headwear', attributes: ['snapback'], note: 'Premium snapback' },
  { styleNumber: 'NE400', brand: 'New Era', name: 'Structured Cap', tier: 'staff-pick', category: 'headwear', attributes: ['structured'], note: 'New Era structured' },
  { styleNumber: 'OC771', brand: 'Outdoor Cap', name: 'Premium Low Profile', tier: 'value', category: 'headwear', attributes: ['unstructured'], note: 'Budget dad hat' },
  { styleNumber: 'OC770', brand: 'Outdoor Cap', name: 'Washed Chino Cap', tier: 'value', category: 'headwear', attributes: ['unstructured'], note: 'Washed casual cap' },
  { styleNumber: '3000', brand: 'Sportsman', name: 'Mesh-Back Cap', tier: 'value', category: 'headwear', attributes: ['trucker'], note: 'Budget trucker' },
  { styleNumber: 'SP08', brand: 'Sportsman', name: 'Cuff Beanie', tier: 'value', category: 'headwear', attributes: ['beanie'], note: 'Budget cuff beanie' },

  // Additional Youth & Kids
  { styleNumber: '3001YCVC', brand: 'Bella+Canvas', name: 'Youth CVC Tee', tier: 'staff-pick', category: 'youth', attributes: ['cvc'], note: 'Soft CVC youth' },
  { styleNumber: '2000B', brand: 'Gildan', name: 'Youth Ultra Cotton', tier: 'value', category: 'youth', note: 'Budget youth tee' },
  { styleNumber: 'G240B', brand: 'Gildan', name: 'Youth Ultra Cotton LS', tier: 'value', category: 'youth', note: 'Youth long sleeve' },
  { styleNumber: '996YR', brand: 'Jerzees', name: 'Youth NuBlend Hoodie', tier: 'value', category: 'youth', note: 'Budget youth hoodie' },
  { styleNumber: 'RS3302', brand: 'Rabbit Skins', name: 'Infant Cotton Snap Tee', tier: 'staff-pick', category: 'youth', attributes: ['infant'], note: 'Lap shoulder infant' },
  { styleNumber: 'RS1004', brand: 'Rabbit Skins', name: 'Infant Long Sleeve Bodysuit', tier: 'staff-pick', category: 'youth', attributes: ['infant'], note: 'Infant onesie LS' },

  // Additional Womens
  { styleNumber: 'G180L', brand: 'Gildan', name: 'Ladies Heavy Blend Crew', tier: 'value', category: 'womens', note: 'Womens crewneck value' },
  { styleNumber: 'G185FL', brand: 'Gildan', name: 'Ladies Heavy Blend Hoodie', tier: 'value', category: 'womens', note: 'Womens hoodie value' },
  { styleNumber: '6610', brand: 'Next Level', name: 'Womens CVC Tee', tier: 'staff-pick', category: 'womens', attributes: ['cvc'], note: 'Soft CVC womens' },
  { styleNumber: '6051', brand: 'Next Level', name: 'Womens Tri-Blend 3/4 Raglan', tier: 'staff-pick', category: 'womens', attributes: ['3/4-sleeve', 'tri-blend'], note: 'Womens raglan' },
  { styleNumber: 'B6400', brand: 'Bella+Canvas', name: 'Womens Relaxed Jersey Tee', tier: 'staff-pick', category: 'womens', attributes: ['relaxed'], note: 'Relaxed fit womens' },
  { styleNumber: '6400', brand: 'Bella+Canvas', name: 'Womens Relaxed Jersey SS', tier: 'staff-pick', category: 'womens', note: 'Same as B6400' },
  { styleNumber: '1537', brand: 'Next Level', name: 'Womens Ideal Racerback', tier: 'staff-pick', category: 'womens', attributes: ['racerback'], note: 'Racerback tank' },
  { styleNumber: '6480', brand: 'Bella+Canvas', name: 'Womens Cropped Tee', tier: 'streetwear', category: 'womens', attributes: ['cropped'], note: 'Trendy crop tee' },

  // Additional Tanks
  { styleNumber: '5307', brand: 'Tultex', name: 'Unisex Fine Jersey Tank', tier: 'value', category: 'tank-tops', note: 'Tultex tank value' },
  { styleNumber: 'G270', brand: 'Gildan', name: 'Adult Tank', tier: 'value', category: 'tank-tops', note: 'Budget basic tank' },
  { styleNumber: '3620', brand: 'Next Level', name: 'Cotton Tank', tier: 'staff-pick', category: 'tank-tops', note: 'Premium cotton tank' },
  { styleNumber: '5003', brand: 'Comfort Colors', name: 'Heavyweight Pocket Tank', tier: 'streetwear', category: 'tank-tops', attributes: ['pocket', 'garment-dyed'], note: 'Pocket tank trending' },

  // Bags & Accessories
  { styleNumber: 'BG100', brand: 'Port Authority', name: 'Basic Tote', tier: 'bestseller', category: 'outerwear', attributes: ['bags'], note: 'Popular tote bag' },
  { styleNumber: 'BG408', brand: 'Port Authority', name: 'Document Tote', tier: 'staff-pick', category: 'outerwear', attributes: ['bags'], note: 'Document carry tote' },
  { styleNumber: 'C922', brand: 'Port Authority', name: 'Knit Cuff Beanie', tier: 'value', category: 'headwear', attributes: ['beanie'], note: 'Port Authority beanie' },
  { styleNumber: 'BX001', brand: 'Big Accessories', name: '6-Panel Brushed Twill', tier: 'value', category: 'headwear', attributes: ['structured'], note: 'Classic 6-panel' },
  { styleNumber: 'BX880', brand: 'Big Accessories', name: '5-Panel Golf Cap', tier: 'staff-pick', category: 'headwear', attributes: ['5-panel'], note: 'Golf style cap' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all popular product style numbers as a Set for quick lookup
 */
export function getPopularStyleNumbers(): Set<string> {
  return new Set(POPULAR_PRODUCTS.map(p => p.styleNumber.toUpperCase()));
}

/**
 * Check if a style number is in the popular products list
 */
export function isPopularStyleNumber(styleNumber: string): boolean {
  const popularSet = getPopularStyleNumbers();
  return popularSet.has(styleNumber.toUpperCase());
}

/**
 * Get popular products by category
 */
export function getPopularByCategory(category: ProductCategory): PopularProduct[] {
  return POPULAR_PRODUCTS.filter(p => p.category === category);
}

/**
 * Get popular products by tier
 */
export function getPopularByTier(tier: ProductTier): PopularProduct[] {
  return POPULAR_PRODUCTS.filter(p => p.tier === tier);
}

/**
 * Get popular products that match specific attributes
 */
export function getPopularByAttribute(attribute: string): PopularProduct[] {
  return POPULAR_PRODUCTS.filter(p => p.attributes?.includes(attribute));
}

/**
 * Get a random selection of popular products for homepage display
 * Balanced across tiers
 */
export function getHomepageFeatured(count: number = 6): PopularProduct[] {
  const bestsellers = getPopularByTier('bestseller');
  const staffPicks = getPopularByTier('staff-pick');
  const streetwear = getPopularByTier('streetwear');
  const value = getPopularByTier('value');
  
  // Get 2 from each main tier, shuffle within each
  const shuffle = <T>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5);
  
  const featured = [
    ...shuffle(bestsellers).slice(0, 2),
    ...shuffle(staffPicks).slice(0, 2),
    ...shuffle(streetwear).slice(0, 1),
    ...shuffle(value).slice(0, 1),
  ];
  
  return shuffle(featured).slice(0, count);
}

/**
 * Get tier display info for badges
 */
export function getTierInfo(tier: ProductTier): { label: string; color: string; bgColor: string } {
  const tierInfo: Record<ProductTier, { label: string; color: string; bgColor: string }> = {
    'bestseller': { label: 'Best Seller', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    'staff-pick': { label: 'Staff Pick', color: 'text-brand-700', bgColor: 'bg-brand-100' },
    'value': { label: 'Great Value', color: 'text-green-700', bgColor: 'bg-green-100' },
    'streetwear': { label: 'Trending', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  };
  return tierInfo[tier];
}

/**
 * Get stats about the popular products
 */
export function getPopularStats() {
  return {
    total: POPULAR_PRODUCTS.length,
    byTier: {
      bestseller: getPopularByTier('bestseller').length,
      'staff-pick': getPopularByTier('staff-pick').length,
      value: getPopularByTier('value').length,
      streetwear: getPopularByTier('streetwear').length,
    },
    byCategory: {
      't-shirts': getPopularByCategory('t-shirts').length,
      'long-sleeve': getPopularByCategory('long-sleeve').length,
      'tank-tops': getPopularByCategory('tank-tops').length,
      'crewneck': getPopularByCategory('crewneck').length,
      'hoodies': getPopularByCategory('hoodies').length,
      'zip-hoodies': getPopularByCategory('zip-hoodies').length,
      'quarter-zip': getPopularByCategory('quarter-zip').length,
      'polos': getPopularByCategory('polos').length,
      'performance': getPopularByCategory('performance').length,
      'headwear': getPopularByCategory('headwear').length,
      'outerwear': getPopularByCategory('outerwear').length,
      'youth': getPopularByCategory('youth').length,
      'womens': getPopularByCategory('womens').length,
    },
  };
}
