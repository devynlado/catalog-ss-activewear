'use client';

import Image from 'next/image';
import { Check, Plus } from 'lucide-react';
import { getAllTierPrices, type StreetWearProduct } from '@/lib/streetwear-config';
import { useStreetWearInquiry } from '@/lib/streetwear-inquiry-store';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: StreetWearProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isSelected, addProduct, removeProduct } = useStreetWearInquiry();
  const selected = isSelected(product.id);
  const tierPrices = getAllTierPrices(product.baseCost);

  function handleToggle() {
    if (selected) {
      removeProduct(product.id);
    } else {
      addProduct({
        productId: product.id,
        title: product.title,
        category: product.category,
        image: product.image,
      });
    }
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all duration-200',
        selected
          ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg'
          : 'border-stone-200 hover:border-stone-300 hover:shadow-md'
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <Image
          src={`/images/streetwear/${product.image}`}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {selected && (
          <div className="absolute inset-0 bg-brand-500/10" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
          {product.title}
        </h3>

        {/* Features */}
        <div className="mt-2 flex flex-wrap gap-1">
          {product.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Tier Pricing */}
        <div className="mt-3 space-y-1">
          {tierPrices.map((tier, i) => (
            <div
              key={tier.qty}
              className={cn(
                'flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs',
                i === 1
                  ? 'bg-brand-50 text-brand-900 font-medium'
                  : 'text-slate-600'
              )}
            >
              <span>{tier.label}</span>
              <span className="font-semibold tabular-nums">
                ${tier.unitPrice.toFixed(2)}/ea
              </span>
            </div>
          ))}
        </div>

        <p className="mt-2 text-[10px] text-stone-400">
          Min. 100 pieces per style/color
        </p>

        {/* Add to Inquiry Button */}
        <button
          onClick={handleToggle}
          className={cn(
            'mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
            selected
              ? 'bg-brand-500 text-white hover:bg-brand-600'
              : 'bg-stone-900 text-white hover:bg-stone-800'
          )}
        >
          {selected ? (
            <>
              <Check className="h-4 w-4" />
              Added to Inquiry
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to Inquiry
            </>
          )}
        </button>
      </div>
    </div>
  );
}
