export interface VariantRow {
  sku: string;
  size_name: string;
  size_order: string | null;
  qty: number;
  availability: string;
  min_order_quantity: number | null;
}

export interface VariantColorGroup {
  color_name: string;
  color_code: string;
  skus: VariantRow[];
}

export interface ProductEditProductInfo {
  style_id: number;
  style_name: string;
  brand_name: string;
  brand_id: number | null;
  title: string;
  primary_image_url: string | null;
  slug: string | null;
  is_active: boolean;
  admin_note: string | null;
  min_order_quantity: number | null;
}

export interface ProductEditInitialData {
  product: ProductEditProductInfo;
  variants: VariantColorGroup[];
}
