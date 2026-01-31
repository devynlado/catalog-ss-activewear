import Image from 'next/image';
import Link from 'next/link';
import { Phone, Mail, Calendar, MessageSquare, Star, Zap, Palette, Shirt, Building2, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Specialty icons mapping
const specialtyIcons: Record<string, React.ElementType> = {
  'Screen Printing': Palette,
  'Embroidery': Shirt,
  'Streetwear': Star,
  'Corporate': Building2,
  'Rush Orders': Zap,
  'Large Orders': Building2,
};

interface SalesRepCardProps {
  rep: {
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
    calendly_url?: string | null;
    // Enhanced fields
    title?: string | null;
    years_experience?: number | null;
    specialties?: string[] | null;
    bio?: string | null;
    portfolio_images?: string[] | null;
    response_time?: string | null;
  };
  stats?: {
    totalCustomers?: number;
    totalQuotes?: number;
    joinedDate?: string;
  };
  showActions?: boolean;
  showEnhanced?: boolean; // Show specialties, portfolio, etc.
  onMessage?: () => void;
}

export function SalesRepCard({ rep, stats, showActions = true, showEnhanced = false, onMessage }: SalesRepCardProps) {
  const initials = rep.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  // Default values for enhanced display
  const title = rep.title || 'Account Manager';
  const yearsExp = rep.years_experience || 5;
  const specialties = rep.specialties || ['Screen Printing', 'Rush Orders'];
  const responseTime = rep.response_time || '< 2 hours';
  const portfolioImages = rep.portfolio_images || [];

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Section Header */}
      {showEnhanced && (
        <div className="px-5 pt-4 pb-0">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Your Account Manager
          </h2>
        </div>
      )}
      
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {rep.avatar_url ? (
              <Image
                src={rep.avatar_url}
                alt={rep.full_name || 'Sales Rep'}
                width={72}
                height={72}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-600">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-navy-800">{rep.full_name}</h3>
            <p className="text-sm text-slate-500">{title}</p>
            
            {/* Experience Badge */}
            {showEnhanced && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <Star className="h-3 w-3 fill-current" />
                {yearsExp}+ years experience
              </div>
            )}
            
            {/* Basic stats (for admin view) */}
            {stats && !showEnhanced && (
              <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
                {stats.totalCustomers !== undefined && (
                  <span>{stats.totalCustomers} customers</span>
                )}
                {stats.totalQuotes !== undefined && (
                  <span>{stats.totalQuotes} quotes</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-1.5">
          {rep.phone && (
            <a 
              href={`tel:${rep.phone}`}
              className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
            >
              <Phone className="h-4 w-4" />
              {rep.phone}
            </a>
          )}
          <a 
            href={`mailto:${rep.email}`}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <Mail className="h-4 w-4" />
            {rep.email}
          </a>
        </div>
      </div>

      {/* Enhanced Content */}
      {showEnhanced && (
        <>
          {/* Specialties */}
          <div className="border-t border-stone-100 px-5 py-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              I Can Help With
            </h4>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => {
                const Icon = specialtyIcons[specialty] || Star;
                return (
                  <span 
                    key={specialty}
                    className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    <Icon className="h-3 w-3 text-brand-500" />
                    {specialty}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Response Time */}
          <div className="border-t border-stone-100 px-5 py-3 bg-stone-50/50">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-slate-600">Usually responds in</span>
              <span className="font-medium text-slate-800">{responseTime}</span>
            </div>
          </div>

          {/* Portfolio Preview */}
          {portfolioImages.length > 0 && (
            <div className="border-t border-stone-100 px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Recent Projects
                </h4>
                <Link 
                  href="/portfolio"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex gap-2">
                {portfolioImages.slice(0, 3).map((img, i) => (
                  <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden bg-stone-100">
                    <Image
                      src={img}
                      alt={`Project ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 border-t border-stone-100 p-4 bg-stone-50/30">
          {rep.calendly_url && (
            <a href={rep.calendly_url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="primary" size="sm" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Call
              </Button>
            </a>
          )}
          {onMessage && (
            <Button variant="secondary" size="sm" onClick={onMessage} className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for inline display
export function SalesRepBadge({ rep }: { rep: { full_name: string; avatar_url?: string | null } }) {
  const initials = rep.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="flex items-center gap-2">
      {rep.avatar_url ? (
        <Image
          src={rep.avatar_url}
          alt={rep.full_name || 'Sales Rep'}
          width={28}
          height={28}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600">
          {initials}
        </div>
      )}
      <span className="text-sm text-slate-700">{rep.full_name}</span>
    </div>
  );
}
