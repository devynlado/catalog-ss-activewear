// SS Activewear API Types

export interface SSProduct {
  styleID: number;
  partNumber: string;
  styleName: string;
  uniqueStyleName: string;
  brandName: string;
  brandID?: number;
  styleImage: string;
  brandImage?: string;
  title: string;
  description: string;
  baseCategory: string;
  categories: string; // Comma-separated category IDs
  basePrice?: number;
  ourPrice?: number;
  salePrice?: number | null;
  caseQty?: number;
  unitWeight?: number;
  mapPrice?: number | null;
  newStyle?: boolean;
  sustainableStyle?: boolean;
  styles?: SSStyleVariant[]; // Color variants (from detailed endpoint)
}

export interface SSStyleVariant {
  styleID: number;
  partNumber: string;
  colorName: string;
  colorCode: string;
  colorPriceCodeName: string;
  colorSwatchImage: string;
  colorSwatchTextColor: string;
  colorFrontImage: string;
  colorBackImage: string;
  colorSideImage: string;
  colorDirectSideImage: string;
  sizes: SSSize[];
}

// SKU-level data from /products/ endpoint
export interface SSProductSku {
  sku: string;
  gtin: string;
  styleID: number;
  brandName: string;
  brandID: string;
  styleName: string;
  colorName: string;
  colorCode: string;
  colorPriceCodeName: string;
  colorGroup: string;
  colorGroupName: string;
  colorFamilyID: string;
  colorFamily: string;
  colorSwatchImage: string;
  colorSwatchTextColor: string;
  colorFrontImage: string;
  colorSideImage: string;
  colorBackImage: string;
  colorDirectSideImage: string;
  colorOnModelFrontImage: string;
  colorOnModelSideImage: string;
  colorOnModelBackImage: string;
  color1: string;
  color2: string;
  sizeName: string;
  sizeCode: string;
  sizeOrder: string;
  sizePriceCodeName: string;
  caseQty: number;
  unitWeight: number;
  mapPrice: number;
  piecePrice: number;
  dozenPrice: number;
  casePrice: number;
  salePrice: number;
  customerPrice: number;
  qty: number;
  warehouses: SSWarehouse[];
  baseCategoryID?: string;
  noeRetailing?: boolean;
  countryOfOrigin?: string;
}

export interface SSWarehouse {
  warehouseAbbr: string;
  skuID: number;
  qty: number;
  closeout: boolean;
  dropship: boolean;
  excludeFreeFreight: boolean;
  fullCaseOnly: boolean;
  returnable: boolean;
  expectedInventory: string;
}

export interface SSSize {
  sizeName: string;
  sizeOrder: number;
  sizeCode: string;
  gtin: string;
  customerPrice: number;
  salePrice: number | null;
  qty: number;
  piecePrice: number;
  dozenPrice: number;
  casePrice: number;
}

export interface SSCategory {
  categoryID: number;
  name: string;  // API returns 'name' not 'categoryName'
  image?: string;
}

export interface SSInventory {
  sku: string;
  styleID: number;
  brandName: string;
  styleName: string;
  colorName: string;
  colorCode: string;
  sizeName: string;
  qty: number;
  warehouseAbbr: string;
}

export interface SSBrand {
  brandID: number;
  brandName?: string;
  name?: string;  // API may return 'name' instead of 'brandName'
  brandImage?: string;
  image?: string;
}

// Application Types

export interface Product {
  id: string;
  styleId: number;
  styleName: string;
  brandName: string;
  brandId: number;
  slug: string; // SEO-friendly URL slug (e.g., "gildan-5000")
  title: string;
  description: string;
  basePrice: number;
  price: number;
  salePrice: number | null;
  imageUrl: string;
  categories: Category[];
  colors: ProductColor[];
  // Product flags for badges and filters
  isOnSale?: boolean;
  isSustainable?: boolean;
  isNew?: boolean;
  // Popular products system
  isPopular?: boolean;
  popularTier?: 'bestseller' | 'staff-pick' | 'value' | 'streetwear';
  // Multi-supplier support
  supplier?: 'ss_activewear' | 'otto_cap' | 'los_angeles_apparel' | 'as_colour';
  gender?: string;
  // SEO-only fields (not displayed on website, used for <title>, <meta>, JSON-LD)
  seoTitle?: string;
  metaDescription?: string;
  // Review aggregates (denormalized from reviews table)
  avgRating?: number | null;
  reviewCount?: number;
  // Discontinued / active status
  isActive?: boolean;
  // Admin overrides editable in /admin/products
  adminNote?: string | null;
  // Style-level default minimum order quantity. Variants without their own
  // override inherit this value. NULL = no minimum.
  minOrderQuantity?: number | null;
}

// Review types
export interface Review {
  id: string;
  styleId: number;
  orderId: string;
  customerEmail: string;
  customerName: string | null;
  rating: number;
  title: string | null;
  body: string;
  reviewerAvatar: string | null;
  status: 'pending' | 'approved' | 'rejected';
  verifiedPurchase: boolean;
  rewardCouponCode?: string | null;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewAggregate {
  avgRating: number;
  reviewCount: number;
  distribution: Record<number, number>; // { 5: 10, 4: 5, 3: 2, 2: 1, 1: 0 }
}

export interface ProductColor {
  colorName: string;
  colorCode: string;
  colorFamily?: string; // For filtering by color family
  swatchImage: string;
  swatchTextColor: string;
  // Flat product images
  frontImage: string;
  backImage: string;
  sideImage: string;
  // Model images (on-model photography)
  onModelFrontImage?: string;
  onModelBackImage?: string;
  onModelSideImage?: string;
  // Additional images (Otto Cap: image_4 through image_10)
  additionalImages?: string[];
  sizes: ProductSize[];
}

export interface ProductSize {
  name: string;
  code: string;
  price: number;
  salePrice: number | null;
  qty: number;
  gtin: string;
  sku?: string;
  // Per-variant minimum order quantity override. NULL/undefined = inherit
  // the style-level Product.minOrderQuantity, which itself may be null.
  minOrderQuantity?: number | null;
}

export interface Category {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
  image: string;
}

// Quote System Types

export interface QuoteItem {
  id: string;
  sku?: string;
  productId: string;
  styleId: number;
  styleName: string;
  brandName: string;
  colorName: string;
  colorCode: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string;
  addedAt: Date;
}

export interface QuoteSubmission {
  items: QuoteItem[];
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
  };
  decoration?: {
    type: string;
    description?: string;
  };
  finishing?: string[];
  eventDate?: string;
  submittedAt?: Date;
}

// Filter Types

export interface CatalogFilters {
  search: string;
  category: string | null;
  brand: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
}

// API Response Types

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
