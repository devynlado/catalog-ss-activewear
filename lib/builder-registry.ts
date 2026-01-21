'use client';

import { Builder } from '@builder.io/react';

// Import custom components
import { ProductGrid } from '@/components/builder/ProductGrid';
import { ProductCard } from '@/components/builder/ProductCard';
import { InventoryMatrix } from '@/components/builder/InventoryMatrix';
import { ColorSwatches } from '@/components/builder/ColorSwatches';
import { SearchBar } from '@/components/builder/SearchBar';
import { FilterSidebar } from '@/components/builder/FilterSidebar';
import { QuickViewModal } from '@/components/builder/QuickViewModal';
import { CategoryNav } from '@/components/builder/CategoryNav';
import { RelatedProducts } from '@/components/builder/RelatedProducts';

// Register ProductGrid component
Builder.registerComponent(ProductGrid, {
  name: 'ProductGrid',
  inputs: [
    {
      name: 'columns',
      type: 'number',
      defaultValue: 4,
      helperText: 'Number of columns on desktop',
    },
    {
      name: 'categoryFilter',
      type: 'string',
      helperText: 'Filter products by category (optional)',
    },
    {
      name: 'brandFilter',
      type: 'string',
      helperText: 'Filter products by brand (optional)',
    },
    {
      name: 'showPricing',
      type: 'boolean',
      defaultValue: true,
      helperText: 'Show pricing on product cards',
    },
    {
      name: 'maxProducts',
      type: 'number',
      defaultValue: 24,
      helperText: 'Maximum number of products to display',
    },
  ],
});

// Register ProductCard component (for individual product display)
Builder.registerComponent(ProductCard, {
  name: 'ProductCard',
  inputs: [
    {
      name: 'productId',
      type: 'string',
      required: true,
      helperText: 'SS Activewear Style ID',
    },
    {
      name: 'showSwatches',
      type: 'boolean',
      defaultValue: true,
    },
  ],
});

// Register InventoryMatrix component
Builder.registerComponent(InventoryMatrix, {
  name: 'InventoryMatrix',
  inputs: [
    {
      name: 'productId',
      type: 'string',
      required: true,
      helperText: 'SS Activewear Style ID',
    },
    {
      name: 'lowStockThreshold',
      type: 'number',
      defaultValue: 12,
      helperText: 'Quantity below this shows as low stock',
    },
    {
      name: 'showQuantities',
      type: 'boolean',
      defaultValue: true,
      helperText: 'Show exact quantities or just availability',
    },
  ],
});

// Register ColorSwatches component
Builder.registerComponent(ColorSwatches, {
  name: 'ColorSwatches',
  inputs: [
    {
      name: 'productId',
      type: 'string',
      required: true,
    },
    {
      name: 'swatchSize',
      type: 'string',
      enum: ['sm', 'md', 'lg'],
      defaultValue: 'md',
    },
    {
      name: 'maxVisible',
      type: 'number',
      defaultValue: 8,
      helperText: 'Maximum swatches to show before +more',
    },
  ],
});

// Register SearchBar component
Builder.registerComponent(SearchBar, {
  name: 'SearchBar',
  inputs: [
    {
      name: 'placeholder',
      type: 'string',
      defaultValue: 'Search by style # or keyword...',
    },
    {
      name: 'showSuggestions',
      type: 'boolean',
      defaultValue: true,
    },
  ],
});

// Register FilterSidebar component
Builder.registerComponent(FilterSidebar, {
  name: 'FilterSidebar',
  inputs: [
    {
      name: 'showBrands',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'showCategories',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'showPriceRange',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'collapsible',
      type: 'boolean',
      defaultValue: true,
    },
  ],
});

// Register QuickViewModal component
Builder.registerComponent(QuickViewModal, {
  name: 'QuickViewModal',
  inputs: [
    {
      name: 'productId',
      type: 'string',
      required: true,
    },
  ],
});

// Register CategoryNav component
Builder.registerComponent(CategoryNav, {
  name: 'CategoryNav',
  inputs: [
    {
      name: 'layout',
      type: 'string',
      enum: ['horizontal', 'vertical', 'grid'],
      defaultValue: 'horizontal',
    },
    {
      name: 'showIcons',
      type: 'boolean',
      defaultValue: false,
    },
  ],
});

// Register RelatedProducts component
Builder.registerComponent(RelatedProducts, {
  name: 'RelatedProducts',
  inputs: [
    {
      name: 'categoryId',
      type: 'number',
      helperText: 'Category ID to show related products from',
    },
    {
      name: 'brandId',
      type: 'number',
      helperText: 'Brand ID to show related products from',
    },
    {
      name: 'currentProductId',
      type: 'string',
      required: true,
      helperText: 'Current product ID to exclude from results',
    },
    {
      name: 'title',
      type: 'string',
      defaultValue: 'You May Also Like',
    },
    {
      name: 'maxProducts',
      type: 'number',
      defaultValue: 8,
    },
  ],
});

// Export Builder instance for use elsewhere
export { Builder };
