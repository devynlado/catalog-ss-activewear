/**
 * Brand-keyword dictionary for the slug-redirect suggestion engine.
 *
 * This is a manually curated mapping from marketing/vendor phrases that
 * commonly appear in legacy WooCommerce / Meta-Catalog slugs to the
 * brands (and sometimes specific style numbers) most likely to match.
 *
 * Why this exists
 * ---------------
 * Slugs from the old WordPress site frequently use marketing names rather
 * than canonical brand+style names from SS Activewear. e.g.
 *
 *   /product/unisex-dri-power-50-50-pocket-t-shirt
 *
 * has no "Jerzees" or "Russell" token at all, so pure string matching
 * against the products table can't find the right SKU. This dictionary
 * encodes the apparel-industry knowledge that "dri-power" is a
 * Jerzees / Russell line, so the scoring engine can boost those brands.
 *
 * How it's used
 * -------------
 * For each entry whose `phrase` appears in the input slug (tokenized,
 * case-insensitive), the scoring engine adds:
 *   - +20 to every candidate whose brand_name matches any of `brands`
 *   - +35 if a style_hints array contains the candidate's style_name
 *
 * Maintenance
 * -----------
 * - Add new entries when you discover a new marketing phrase in the
 *   Unresolved Slugs queue.
 * - Multi-word phrases must use hyphens to match how slugs are tokenized.
 * - Entries are matched as whole tokens or n-grams within the slug; the
 *   engine generates 1, 2, and 3-gram windows so multi-word phrases like
 *   'perfect-t' match a slug containing '...perfect-t...'.
 * - Stale entries (brand no longer carried) lower accuracy but never
 *   break anything — safe to leave in until next review.
 */

export interface BrandDictEntry {
  /** Hyphen-separated phrase to match within a slug. */
  phrase: string;
  /**
   * Brand names that this phrase typically belongs to. Matched
   * case-insensitively against `products.brand_name`.
   */
  brands: string[];
  /**
   * Optional list of style_name strings that this phrase is a strong
   * predictor for. Gets a bigger score bonus than a brand-only match.
   */
  style_hints?: string[];
  /** Human-readable note for the admin to see in the `reasons` array. */
  note?: string;
}

export const BRAND_DICTIONARY: BrandDictEntry[] = [
  // Jerzees / Russell — "Dri-Power" is the Jerzees/Russell synthetic moisture-wicking line.
  { phrase: 'dri-power', brands: ['Jerzees', 'Russell Athletic'], style_hints: ['29M', '29MR', '29MP', '21M', '21MR', '21MP'], note: '"Dri-Power" is a Jerzees/Russell line' },
  { phrase: 'dripower', brands: ['Jerzees', 'Russell Athletic'], note: '"Dri-Power" is a Jerzees/Russell line' },

  // Bella + Canvas — "Perfect Tee" is their women's relaxed-jersey line.
  { phrase: 'perfect-t', brands: ['Bella + Canvas', 'Bella+Canvas', 'BELLA + CANVAS'], style_hints: ['6004', '3001'], note: 'Bella+Canvas markets the 6004/3001 as "The Perfect Tee"' },
  { phrase: 'perfect-tee', brands: ['Bella + Canvas', 'Bella+Canvas', 'BELLA + CANVAS'], style_hints: ['6004', '3001'] },
  { phrase: 'airlume', brands: ['Bella + Canvas', 'Bella+Canvas', 'BELLA + CANVAS'], note: 'Airlume cotton is a Bella+Canvas spec term' },

  // Next Level — Curvy Collection, fine jersey, football, raglan baseball.
  { phrase: 'curvy', brands: ['Next Level Apparel', 'Next Level'], style_hints: ['1560', '1561'], note: 'Curvy Collection is a Next Level line' },
  { phrase: 'curvy-collection', brands: ['Next Level Apparel', 'Next Level'], style_hints: ['1560', '1561'] },
  { phrase: 'fine-jersey', brands: ['Next Level Apparel', 'Next Level', 'Bella + Canvas', 'Bella+Canvas', 'American Apparel'], style_hints: ['1510', '6004', '3600', '2102'], note: '"Fine jersey" women\'s tees are typically Next Level 1510 or Bella+Canvas 6004' },
  { phrase: 'football-v-neck', brands: ['Next Level Apparel', 'Next Level'], style_hints: ['6740', '1175'], note: 'Football V-neck tee is Next Level 6740/1175' },
  { phrase: 'football-tee', brands: ['Next Level Apparel', 'Next Level'], style_hints: ['6740', '1175'] },
  { phrase: 'raglan-baseball', brands: ['Next Level Apparel', 'Next Level', 'Bella + Canvas', 'Bella+Canvas'], style_hints: ['6051', '6251', '3200', '3201'], note: 'Raglan baseball tee is Next Level 6051/6251 or Bella+Canvas 3200/3201' },
  { phrase: 'three-quarter-sleeve-raglan', brands: ['Next Level Apparel', 'Next Level', 'Bella + Canvas', 'Bella+Canvas'], style_hints: ['6051', '6251', '3200', '3201'] },
  { phrase: 'cvc', brands: ['Bella + Canvas', 'Bella+Canvas', 'Next Level Apparel', 'Next Level'], note: 'CVC = combed/ringspun cotton-poly blend (Bella+Canvas, Next Level)' },

  // Tri-blend pieces — multiple brands.
  { phrase: 'triblend', brands: ['Bella + Canvas', 'Bella+Canvas', 'Next Level Apparel', 'Next Level'], style_hints: ['3413', '8413', '6010', '6710'], note: 'Tri-blend tees: Bella+Canvas 3413/8413, Next Level 6010/6710' },
  { phrase: 'tri-blend', brands: ['Bella + Canvas', 'Bella+Canvas', 'Next Level Apparel', 'Next Level'], style_hints: ['3413', '8413', '6010', '6710'] },

  // Gildan — heavyweight & ultra cotton are signature lines.
  { phrase: 'heavy-cotton', brands: ['Gildan'], style_hints: ['5000', 'G500'], note: 'Heavy Cotton tee is Gildan 5000' },
  { phrase: 'heavyweight', brands: ['Gildan', 'Hanes'], style_hints: ['5000', '64000', '5250'], note: '"Heavyweight" tees are typically Gildan 5000/64000 or Hanes 5250' },
  { phrase: 'ultra-cotton', brands: ['Gildan'], style_hints: ['2000', 'G200'], note: 'Ultra Cotton is Gildan 2000' },
  { phrase: 'softstyle', brands: ['Gildan'], style_hints: ['64000', 'G640'], note: 'Softstyle is Gildan 64000' },
  { phrase: 'softspun', brands: ['Gildan'] },

  // Comfort Colors / ComfortWash — Hanes-owned garment-dyed lines.
  { phrase: 'comfortwash', brands: ['ComfortWash by Hanes', 'Hanes', 'ComfortWash'], style_hints: ['GDH100', 'GDH150', 'GDH200', 'GDH250'], note: 'ComfortWash is a Hanes garment-dyed line' },
  { phrase: 'comfort-colors', brands: ['Comfort Colors'], style_hints: ['1717', '6030'], note: 'Comfort Colors 1717 (tee), 6030 (pocket tee)' },
  { phrase: 'garment-dyed', brands: ['Comfort Colors', 'ComfortWash by Hanes', 'Hanes'] },

  // Hanes — premium cotton / nano-T / beefy-T / authentic.
  { phrase: 'nano-t', brands: ['Hanes'], style_hints: ['4980', '498Y'], note: 'Nano-T is Hanes 4980' },
  { phrase: 'nano-tee', brands: ['Hanes'], style_hints: ['4980'] },
  { phrase: 'beefy-t', brands: ['Hanes'], style_hints: ['5180'], note: 'Beefy-T is Hanes 5180' },
  { phrase: 'beefy-tee', brands: ['Hanes'], style_hints: ['5180'] },

  // Champion — Reverse Weave is the signature heavyweight crewneck.
  { phrase: 'reverse-weave', brands: ['Champion'], style_hints: ['S149', 'S101', 'S1051'], note: 'Reverse Weave is the Champion S149/S101 line' },
  { phrase: 'champion-s', brands: ['Champion'], note: 'Champion style numbers usually start with S/CW/T' },

  // Independent Trading Co — signature midweight hoodies.
  { phrase: 'midweight', brands: ['Independent Trading Co', 'Independent Trading Company'], style_hints: ['SS4500', 'SS4500Z', 'IND4000', 'IND4000Z'], note: 'Midweight hoodies are typically Independent Trading SS4500/IND4000' },

  // District / Port & Company — entry-level basics.
  { phrase: 'perfect-blend', brands: ['District'], style_hints: ['DT104', 'DT154'] },
  { phrase: 'perfect-weight', brands: ['District'], style_hints: ['DT104'] },
  { phrase: 'core-blend', brands: ['Port & Company', 'Port and Company'], style_hints: ['PC55', 'PC55T'] },
  { phrase: 'essential-tee', brands: ['Port & Company', 'Port and Company'], style_hints: ['PC61'] },

  // Shaka Wear — Heavyweight Max line.
  { phrase: 'shaka', brands: ['Shaka Wear'], note: 'Shaka Wear (Heavyweight Max line)' },
  { phrase: 'heavyweight-max', brands: ['Shaka Wear'], style_hints: ['SHMHSS'] },

  // Garment types — low-confidence brand hints, used mainly to disambiguate.
  // (These don't add brand boosts on their own; the engine uses them when
  //  combined with a stronger phrase elsewhere in the slug.)
  { phrase: 'ringspun', brands: ['Next Level Apparel', 'Next Level', 'Bella + Canvas', 'Bella+Canvas'], note: 'Ringspun cotton — usually Next Level or Bella+Canvas' },
  { phrase: 'combed-cotton', brands: ['Next Level Apparel', 'Next Level', 'Bella + Canvas', 'Bella+Canvas'] },
  { phrase: 'premium-blend', brands: ['Next Level Apparel', 'Next Level', 'Bella + Canvas', 'Bella+Canvas'] },
];

/**
 * Tokens we strip before scoring because they appear in almost every
 * tee/sweatshirt slug and are essentially noise.
 */
export const STOPWORDS = new Set([
  'the', 'and', 'of', 'for', 'with', 'a', 'an', 'to', 'in', 'on',
  // Gendered/age markers that almost never disambiguate alone.
  'mens', 'womens', 'unisex', 'youth', 'girls', 'boys', 'kids',
  'adult', 'baby', 'infant', 'toddler',
  // Pure garment-type words; useful only in combination.
  'tee', 't-shirt', 'shirt', 'tshirt', 't',
]);

/**
 * Tokens that should be DOWN-WEIGHTED (not removed) when scoring overlap
 * because they are common but still mildly informative.
 */
export const LOW_INFO_TOKENS = new Set([
  'cotton', 'jersey', 'crew', 'crewneck', 'sleeve', 'short', 'long',
  'soft', 'classic', 'basic', 'premium', 'heavy', 'lightweight',
  'standard', 'regular', 'fit', 'fitted',
]);
