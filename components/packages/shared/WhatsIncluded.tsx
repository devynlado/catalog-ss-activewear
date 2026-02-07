'use client';

import { motion } from 'framer-motion';
import { Clock, FileCheck, Palette, Truck, DollarSign, Eye, ShieldCheck, Scissors, Sparkles, Droplets, LucideIcon } from 'lucide-react';
import { WhatsIncludedProps, IconName } from './types';

// Map icon names to actual icon components
const iconMap: Record<IconName, LucideIcon> = {
  Clock,
  FileCheck,
  Palette,
  Truck,
  DollarSign,
  Eye,
  ShieldCheck,
  Scissors,
  Sparkles,
  Droplets,
};

export function WhatsIncluded({
  title = "What's Included in Every Order",
  description,
  items,
  pricingTable,
}: WhatsIncludedProps) {
  return (
    <section id="whats-included" className="py-16 lg:py-20 bg-gradient-to-b from-white to-[#FAF6F3]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
            {title}
          </h2>
          <p className="text-stone-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>
        
        {/* Items grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const Icon = iconMap[item.icon];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200/60"
              >
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center shadow-sm">
                  <Icon className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-stone-600">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Pricing table */}
        <div className="mt-16">
          <h3 className="text-xl font-bold text-navy-900 text-center mb-6">
            Volume Pricing - The More You Order, The More You Save
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto">
              <thead>
                <tr className="border-b border-stone-200">
                  {pricingTable.columns.map((col) => (
                    <th 
                      key={col.key}
                      className={`py-3 px-4 text-sm font-semibold text-navy-900 ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricingTable.rows.map((row) => (
                  <tr 
                    key={row.qty} 
                    className={row.popular ? 'bg-brand-50' : 'border-b border-stone-100'}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-900">{row.qty}</span>
                        {row.popular && (
                          <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full">
                            Best Value
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Dynamic columns based on config */}
                    {pricingTable.columns.slice(1, -1).map((col) => {
                      const value = row[col.key as keyof typeof row];
                      return (
                        <td key={col.key} className={`py-4 px-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                          {typeof value === 'number' ? (
                            <span className={col.key === 'total' || col.key === 'price' ? 'font-semibold text-navy-900' : 'text-stone-600'}>
                              ${value.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-stone-600">{value}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-4 px-4 text-right">
                      {row.savings ? (
                        <span className="text-green-600 font-medium">{row.savings}</span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {pricingTable.footnotes && pricingTable.footnotes.length > 0 && (
            <div className="mt-4 text-center">
              {pricingTable.footnotes.map((note, index) => (
                <p key={index} className="text-sm text-stone-500 mt-2">
                  {note}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
