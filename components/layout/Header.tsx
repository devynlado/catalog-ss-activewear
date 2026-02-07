'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart, Search, ChevronDown, ChevronRight, Phone, Zap, Layers, Sparkles, Maximize2, Monitor, Palette, Scissors, Package, Star, BookOpen, HelpCircle, Users, Mail, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/utils';
import { Brand } from '@/lib/types';
import { getMainCategories } from '@/lib/category-taxonomy';
import { PhoneButton } from '@/components/ui/PhoneButton';
import { createSupabaseBrowserClient, signOut } from '@/lib/supabase-browser';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Services menu configuration
const servicesMenu = {
  screenPrinting: {
    title: 'Screen Printing',
    href: '/services/screen-printing',
    icon: Layers,
    description: 'Standard plastisol printing',
    subItems: [
      { name: 'Puff Printing', href: '/services/puff-screen-printing', icon: Sparkles },
      { name: 'Jumbo Printing', href: '/services/jumbo-screen-printing', icon: Maximize2 },
      { name: 'Digital Screen', href: '/services/digital-screen-printing', icon: Monitor },
      { name: 'Simulated Process', href: '/services/simulated-process', icon: Palette },
    ],
  },
  embroidery: {
    title: 'Embroidery',
    href: '/services/embroidery',
    icon: Scissors,
    description: 'Premium stitched logos',
  },
  finishing: {
    title: 'Retail Finishing',
    href: '/services/retail-finishing',
    icon: Package,
    description: 'Tags, labels & packaging',
  },
  rush: {
    title: 'Rush Turnaround',
    href: '/services/rush',
    icon: Zap,
    description: 'As fast as 48 hours',
    highlight: true,
  },
  largeOrders: {
    title: 'Large Orders',
    href: '/services/large-orders',
    icon: Package,
    description: '500+ pieces, dedicated support',
  },
};

// Get main navigation categories from taxonomy - using slug-based URLs
const mainCategories = getMainCategories().map((cat) => ({
  name: cat.name,
  href: `/catalog/${cat.slug}`,
  categoryId: cat.id.toString(),
}));

// Mega menu subcategory configuration
// These combine category + attribute filters for refined browsing
interface SubcategoryGroup {
  title: string;
  items: { name: string; href: string }[];
}

interface MegaMenuConfig {
  [categoryId: string]: SubcategoryGroup[];
}

// Mega menu configuration using SEO-friendly slug URLs
// Format: /catalog/{parent-slug}/{sub-slug}
// Helper function to check if business is currently open
// Business hours: Monday-Friday, 8am-5pm PST
function isBusinessOpen(): { isOpen: boolean; message: string } {
  const now = new Date();
  // Convert to PST
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const day = pstTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = pstTime.getHours();
  
  const isWeekday = day >= 1 && day <= 5;
  const isDuringHours = hour >= 8 && hour < 17;
  
  if (isWeekday && isDuringHours) {
    return { isOpen: true, message: "We're Available Now! • 10-30 sec wait" };
  }
  
  // Calculate next open time
  if (day === 0) { // Sunday
    return { isOpen: false, message: "Opens Monday at 8am PST" };
  } else if (day === 6) { // Saturday
    return { isOpen: false, message: "Opens Monday at 8am PST" };
  } else if (hour < 8) {
    return { isOpen: false, message: "Opens today at 8am PST" };
  } else {
    // After hours on weekday
    if (day === 5) { // Friday after hours
      return { isOpen: false, message: "Opens Monday at 8am PST" };
    }
    return { isOpen: false, message: "Opens tomorrow at 8am PST" };
  }
}

const megaMenuConfig: MegaMenuConfig = {
  // T-Shirts (category 21)
  '21': [
    {
      title: 'By Style',
      items: [
        { name: 'Core T-Shirts', href: '/catalog/t-shirts/core-tshirts' },
        { name: 'Fashion T-Shirts', href: '/catalog/t-shirts/fashion-tshirts' },
        { name: 'Tank Tops', href: '/catalog/t-shirts/tank-tops' },
        { name: 'Long Sleeve Tees', href: '/catalog/t-shirts/long-sleeve' },
      ],
    },
    {
      title: 'By Sleeve',
      items: [
        { name: 'Short Sleeve', href: '/catalog/t-shirts/short-sleeve' },
        { name: 'Long Sleeve', href: '/catalog/t-shirts/long-sleeve' },
        { name: 'Sleeveless', href: '/catalog/t-shirts/sleeveless' },
        { name: '3/4 Sleeve', href: '/catalog/t-shirts/3-4-sleeve' },
      ],
    },
    {
      title: 'By Collar',
      items: [
        { name: 'Crewneck', href: '/catalog/t-shirts/crewneck' },
        { name: 'V-Neck', href: '/catalog/t-shirts/v-neck' },
      ],
    },
    {
      title: 'By Material',
      items: [
        { name: '100% Cotton', href: '/catalog/t-shirts/cotton' },
        { name: 'Polyester', href: '/catalog/t-shirts/polyester' },
        { name: 'Tri-Blend', href: '/catalog/t-shirts/tri-blend' },
        { name: 'Performance', href: '/catalog/t-shirts/performance' },
      ],
    },
  ],
  // Sweatshirts (category 9)
  '9': [
    {
      title: 'By Style',
      items: [
        { name: 'Hoodies', href: '/catalog/sweatshirts/hoodies' },
        { name: 'Crewnecks', href: '/catalog/sweatshirts/crewneck-sweatshirts' },
        { name: 'Full-Zip', href: '/catalog/sweatshirts/full-zip' },
        { name: 'Quarter-Zip', href: '/catalog/sweatshirts/quarter-zip' },
        { name: 'Pullover', href: '/catalog/sweatshirts/pullover' },
      ],
    },
    {
      title: 'By Weight',
      items: [
        { name: 'Lightweight', href: '/catalog/sweatshirts/lightweight' },
        { name: 'Midweight', href: '/catalog/sweatshirts/midweight' },
        { name: 'Heavyweight', href: '/catalog/sweatshirts/heavyweight' },
      ],
    },
  ],
  // Polos (category 52)
  '52': [
    {
      title: 'By Sleeve',
      items: [
        { name: 'Short Sleeve', href: '/catalog/polos/short-sleeve' },
        { name: 'Long Sleeve', href: '/catalog/polos/long-sleeve' },
      ],
    },
    {
      title: 'By Material',
      items: [
        { name: 'Cotton', href: '/catalog/polos/cotton' },
        { name: 'Performance', href: '/catalog/polos/performance' },
        { name: 'Pique', href: '/catalog/polos/pique' },
      ],
    },
  ],
  // Jackets (category 15)
  '15': [
    {
      title: 'By Style',
      items: [
        { name: 'Lightweight Jackets', href: '/catalog/jackets/lightweight' },
        { name: 'Vests', href: '/catalog/jackets/vests' },
        { name: 'Windbreakers', href: '/catalog/jackets/windbreakers' },
        { name: 'Soft Shells', href: '/catalog/jackets/soft-shell' },
        { name: 'Rain Coats', href: '/catalog/jackets/rain-coats' },
        { name: 'Puffer Jackets', href: '/catalog/jackets/puffer' },
        { name: 'Fleece Jackets', href: '/catalog/jackets/fleece' },
      ],
    },
    {
      title: 'By Feature',
      items: [
        { name: 'Full-Zip', href: '/catalog/jackets/full-zip' },
        { name: 'Quarter-Zip', href: '/catalog/jackets/quarter-zip' },
        { name: 'Hooded', href: '/catalog/jackets/hooded' },
      ],
    },
  ],
  // Headwear (category 11)
  '11': [
    {
      title: 'By Style',
      items: [
        { name: 'Baseball Caps', href: '/catalog/headwear/baseball-caps' },
        { name: 'Trucker Hats', href: '/catalog/headwear/trucker-hats' },
        { name: 'Dad Caps', href: '/catalog/headwear/dad-caps' },
        { name: 'Snapbacks', href: '/catalog/headwear/snapbacks' },
        { name: 'Fitted Caps', href: '/catalog/headwear/fitted-caps' },
        { name: 'Bucket Hats', href: '/catalog/headwear/bucket-hats' },
        { name: 'Beanies', href: '/catalog/headwear/beanies' },
        { name: 'Visors', href: '/catalog/headwear/visors' },
        { name: 'Flat Bills', href: '/catalog/headwear/flat-bills' },
      ],
    },
    {
      title: 'By Structure',
      items: [
        { name: 'Structured', href: '/catalog/headwear/structured' },
        { name: 'Unstructured', href: '/catalog/headwear/unstructured' },
        { name: 'Soft-Structured', href: '/catalog/headwear/soft-structured' },
        { name: '5-Panel', href: '/catalog/headwear/5-panel' },
        { name: '6-Panel', href: '/catalog/headwear/6-panel' },
      ],
    },
    {
      title: 'By Closure',
      items: [
        { name: 'Snapback', href: '/catalog/headwear/snapbacks' },
        { name: 'Adjustable', href: '/catalog/headwear/adjustable' },
        { name: 'Hook and Loop', href: '/catalog/headwear/hook-and-loop' },
      ],
    },
  ],
  // Bottoms (category 384)
  '384': [
    {
      title: 'By Style',
      items: [
        { name: 'Shorts', href: '/catalog/bottoms/shorts' },
        { name: 'Sweatpants', href: '/catalog/bottoms/sweatpants' },
        { name: 'Leggings', href: '/catalog/bottoms/leggings' },
        { name: 'Pants', href: '/catalog/bottoms/pants' },
      ],
    },
    {
      title: 'By Gender',
      items: [
        { name: 'Mens & Unisex', href: '/catalog/bottoms/mens-unisex' },
        { name: 'Womens', href: '/catalog/bottoms/womens' },
        { name: 'Youth', href: '/catalog/bottoms/youth' },
      ],
    },
  ],
  // Bags (category 102)
  '102': [
    {
      title: 'By Style',
      items: [
        { name: 'Backpacks', href: '/catalog/bags/backpacks' },
        { name: 'Tote Bags', href: '/catalog/bags/tote-bags' },
        { name: 'Duffel Bags', href: '/catalog/bags/duffel-bags' },
        { name: 'Cooler Bags', href: '/catalog/bags/cooler-bags' },
        { name: 'Drawstring Bags', href: '/catalog/bags/drawstring-bags' },
        { name: 'Messenger Bags', href: '/catalog/bags/messenger-bags' },
      ],
    },
  ],
  // Accessories (category 53)
  '53': [
    {
      title: 'By Type',
      items: [
        { name: 'Scarves', href: '/catalog/accessories/scarves' },
        { name: 'Blankets', href: '/catalog/accessories/blankets' },
        { name: 'Towels', href: '/catalog/accessories/towels' },
        { name: 'Aprons', href: '/catalog/accessories/aprons' },
        { name: 'Bandanas', href: '/catalog/accessories/bandanas' },
        { name: 'Gloves', href: '/catalog/accessories/gloves' },
        { name: 'Socks', href: '/catalog/accessories/socks' },
      ],
    },
  ],
  // Womens (category 13)
  '13': [
    {
      title: 'By Category',
      items: [
        { name: 'T-Shirts', href: '/catalog/womens/t-shirts' },
        { name: 'Tank Tops', href: '/catalog/womens/tank-tops' },
        { name: 'Sweatshirts', href: '/catalog/womens/sweatshirts' },
        { name: 'Polos', href: '/catalog/womens/polos' },
        { name: 'Bottoms', href: '/catalog/womens/bottoms' },
      ],
    },
    {
      title: 'By Fit',
      items: [
        { name: 'Fitted', href: '/catalog/womens/fitted' },
        { name: 'Relaxed', href: '/catalog/womens/relaxed' },
        { name: 'Cropped', href: '/catalog/womens/cropped' },
        { name: 'Flowy', href: '/catalog/womens/flowy' },
      ],
    },
  ],
  // Workwear (category 49)
  '49': [
    {
      title: 'By Style',
      items: [
        { name: 'Safety Vests', href: '/catalog/workwear/safety-vests' },
        { name: 'Hi-Vis', href: '/catalog/workwear/hi-vis' },
        { name: 'Work Jackets', href: '/catalog/workwear/work-jackets' },
        { name: 'Work Pants', href: '/catalog/workwear/work-pants' },
      ],
    },
    {
      title: 'By Feature',
      items: [
        { name: 'ANSI Class 2', href: '/catalog/workwear/ansi-class-2' },
        { name: 'ANSI Class 3', href: '/catalog/workwear/ansi-class-3' },
      ],
    },
  ],
};


export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [businessStatus, setBusinessStatus] = useState(() => isBusinessOpen());
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const shopRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const megaMenuCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const servicesCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const shopCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const resourcesCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { items, openDrawer, justAdded } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Auto-focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // Close mobile search when menu opens
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileSearchOpen(false);
    }
  }, [mobileMenuOpen]);

  // Shop menu hover handlers with 300ms close delay
  const handleShopEnter = () => {
    if (shopCloseTimer.current) {
      clearTimeout(shopCloseTimer.current);
      shopCloseTimer.current = null;
    }
    setShopOpen(true);
    setServicesOpen(false);
    setResourcesOpen(false);
  };

  const handleShopLeave = () => {
    shopCloseTimer.current = setTimeout(() => {
      setShopOpen(false);
      setActiveMegaMenu(null);
      shopCloseTimer.current = null;
    }, 300);
  };

  // Services menu hover handlers with 300ms close delay
  const handleServicesEnter = () => {
    if (servicesCloseTimer.current) {
      clearTimeout(servicesCloseTimer.current);
      servicesCloseTimer.current = null;
    }
    setServicesOpen(true);
    setShopOpen(false);
    setResourcesOpen(false);
  };

  const handleServicesLeave = () => {
    servicesCloseTimer.current = setTimeout(() => {
      setServicesOpen(false);
      servicesCloseTimer.current = null;
    }, 300);
  };

  // Resources menu hover handlers with 300ms close delay
  const handleResourcesEnter = () => {
    if (resourcesCloseTimer.current) {
      clearTimeout(resourcesCloseTimer.current);
      resourcesCloseTimer.current = null;
    }
    setResourcesOpen(true);
    setShopOpen(false);
    setServicesOpen(false);
  };

  const handleResourcesLeave = () => {
    resourcesCloseTimer.current = setTimeout(() => {
      setResourcesOpen(false);
      resourcesCloseTimer.current = null;
    }, 300);
  };

  // Mega menu hover handlers with 300ms close delay (for shop submenu)
  const handleMegaMenuEnter = (categoryId: string | null) => {
    // Clear any pending close timer
    if (megaMenuCloseTimer.current) {
      clearTimeout(megaMenuCloseTimer.current);
      megaMenuCloseTimer.current = null;
    }
    setActiveMegaMenu(categoryId);
  };

  const handleMegaMenuLeave = () => {
    // Start 300ms timer before closing
    megaMenuCloseTimer.current = setTimeout(() => {
      setActiveMegaMenu(null);
      megaMenuCloseTimer.current = null;
    }, 300);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (megaMenuCloseTimer.current) {
        clearTimeout(megaMenuCloseTimer.current);
      }
      if (servicesCloseTimer.current) {
        clearTimeout(servicesCloseTimer.current);
      }
      if (shopCloseTimer.current) {
        clearTimeout(shopCloseTimer.current);
      }
      if (resourcesCloseTimer.current) {
        clearTimeout(resourcesCloseTimer.current);
      }
    };
  }, []);

  // Update business status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setBusinessStatus(isBusinessOpen());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Fetch brands for dropdown
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch('/api/brands');
        if (res.ok) {
          const data = await res.json();
          setBrands(data.data || []);
        }
      } catch (e) {
        console.error('Error fetching brands:', e);
      }
    };
    fetchBrands();
  }, []);

  // Check auth state
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setUserLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    window.location.href = '/';
  };


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(event.target as Node)) {
        setShopOpen(false);
        setActiveMegaMenu(null);
      }
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setActiveMegaMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Popular brands to show at top
  const popularBrands = brands.filter(b => 
    ['Gildan', 'Bella+Canvas', 'Next Level', 'Hanes', 'Port & Company', 'Champion', 'Nike', 'Adidas'].some(
      name => b.name.toLowerCase().includes(name.toLowerCase())
    )
  ).slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm shadow-stone-200/50">
      {/* ============== TIER 1: UTILITY BAR ============== */}
      <div className="relative bg-gradient-to-r from-[#070131] via-[#0a0142] to-[#070131] text-white">
        {/* Grain texture */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-auto py-2.5 items-center justify-between text-xs sm:h-10 sm:py-0">
            {/* Left - Talk to Our Team with dynamic status */}
            <PhoneButton 
              className="flex items-center gap-2 text-white hover:text-brand-300 transition-colors group"
              showIcon={false}
            >
              <div className={cn(
                "flex items-center justify-center h-6 w-6 flex-shrink-0 rounded-full text-white",
                businessStatus.isOpen ? "bg-green-500" : "bg-stone-500"
              )}>
                {businessStatus.isOpen ? (
                  <Phone className="h-3 w-3" />
                ) : (
                  <Mail className="h-3 w-3" />
                )}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-white group-hover:text-brand-300">
                  <span className="hidden sm:inline">Talk to Our Team</span>
                  <span className="sm:hidden">(855) 942-7636</span>
                </span>
                <span className="text-[10px]">
                  {businessStatus.isOpen ? (
                    <>
                      <span className="hidden sm:inline text-white/80">(855) 942-7636 • </span>
                      <span className="text-amber-400">
                        {businessStatus.message}
                      </span>
                    </>
                  ) : (
                    <span className="text-stone-400">{businessStatus.message} • Leave a message</span>
                  )}
                </span>
              </div>
            </PhoneButton>
            
            {/* Center - Rating badge */}
            <div className="hidden items-center gap-1 md:flex">
              <div className="flex">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={cn("h-3 w-3", i <= 4 ? "text-yellow-400 fill-yellow-400" : "text-yellow-400 fill-yellow-400/50")} />
                ))}
              </div>
              <span className="text-stone-300 ml-1">4.8 stars on Google</span>
            </div>
            
            {/* Right - Resources dropdown + Rush promo */}
            <div className="flex items-center gap-4">
              {/* Resources Dropdown */}
              <div 
                className="relative" 
                ref={resourcesRef}
                onMouseEnter={handleResourcesEnter}
                onMouseLeave={handleResourcesLeave}
              >
                <button 
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  className="flex items-center gap-1 text-stone-300 hover:text-white transition-colors"
                >
                  Resources
                  <ChevronDown className={cn('h-3 w-3 transition-transform', resourcesOpen && 'rotate-180')} />
                </button>
                
                {resourcesOpen && (
                  <div className="absolute right-0 top-full z-[60] mt-2 w-64 rounded-lg bg-white p-3 shadow-xl ring-1 ring-stone-200">
                    <Link
                      href="/resources/screen-printing-guide"
                      onClick={() => setResourcesOpen(false)}
                      className="flex items-start gap-3 rounded-lg p-2 hover:bg-stone-50 group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-slate-900 group-hover:text-brand-600">Screen Printing Guide</span>
                        <span className="text-xs text-slate-500">Prepare your artwork</span>
                      </div>
                    </Link>
                    <Link
                      href="/resources/embroidery-guide"
                      onClick={() => setResourcesOpen(false)}
                      className="flex items-start gap-3 rounded-lg p-2 hover:bg-stone-50 group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-slate-900 group-hover:text-brand-600">Embroidery Guide</span>
                        <span className="text-xs text-slate-500">Digitizing tips</span>
                      </div>
                    </Link>
                    <Link
                      href="/guides"
                      onClick={() => setResourcesOpen(false)}
                      className="flex items-start gap-3 rounded-lg p-2 hover:bg-emerald-50 active:bg-emerald-100 group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-emerald-600 group-hover:text-emerald-700">Product Guides</span>
                        <span className="text-xs text-slate-500">Browse curated collections</span>
                      </div>
                    </Link>
                    <div className="my-2 border-t border-stone-100" />
                    <Link
                      href="/faq"
                      onClick={() => setResourcesOpen(false)}
                      className="flex items-center gap-3 rounded-lg p-2 text-sm text-slate-600 hover:bg-stone-50 hover:text-slate-900"
                    >
                      <HelpCircle className="h-4 w-4" />
                      FAQ
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setResourcesOpen(false)}
                      className="flex items-center gap-3 rounded-lg p-2 text-sm text-slate-600 hover:bg-stone-50 hover:text-slate-900"
                    >
                      <Users className="h-4 w-4" />
                      About Us
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Rush Promo - subtle upsell */}
              <Link
                href="/services/rush"
                className="hidden items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors sm:flex"
              >
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Rush: 48hr</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============== TIER 2: MAIN NAVIGATION ============== */}
      <nav className="border-b border-stone-100/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo - Full wordmark on all screen sizes */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center py-2">
                <Image
                  src="/images/brand/logo-wordmark-dark.svg"
                  alt="Garment Decor"
                  width={160}
                  height={36}
                  className="h-8 w-auto sm:h-9"
                  priority
                />
              </Link>
            </div>

            {/* Main Nav Items (Desktop) */}
            <div className="hidden items-center gap-1 lg:flex">
              {/* Shop Dropdown */}
              <div 
                className="relative" 
                ref={shopRef}
                onMouseEnter={handleShopEnter}
                onMouseLeave={handleShopLeave}
              >
                <button
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    shopOpen
                      ? 'bg-stone-100 text-slate-900'
                      : 'text-slate-700 hover:bg-stone-50 hover:text-slate-900'
                  )}
                >
                  Shop
                  <ChevronDown className={cn('h-4 w-4 transition-transform', shopOpen && 'rotate-180')} />
                </button>

                {shopOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-[800px] rounded-xl bg-white p-6 shadow-xl ring-1 ring-stone-200">
                    <div className="grid grid-cols-12 gap-6">
                      {/* Categories Column */}
                      <div className="col-span-3">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Categories
                        </h3>
                        <div className="space-y-1">
                          <Link
                            href="/catalog"
                            onClick={() => setShopOpen(false)}
                            onMouseEnter={() => handleMegaMenuEnter(null)}
                            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-brand-50 hover:text-brand-700"
                          >
                            All Products
                          </Link>
                          {mainCategories.map((cat) => {
                            const hasMegaMenu = megaMenuConfig[cat.categoryId];
                            return (
                              <Link
                                key={cat.name}
                                href={cat.href}
                                onClick={() => setShopOpen(false)}
                                onMouseEnter={() => handleMegaMenuEnter(hasMegaMenu ? cat.categoryId : null)}
                                className={cn(
                                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-stone-50 hover:text-slate-900',
                                  activeMegaMenu === cat.categoryId && 'bg-stone-50 text-slate-900'
                                )}
                              >
                                {cat.name}
                                {hasMegaMenu && <ChevronRight className="h-4 w-4 text-stone-400" />}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Subcategory Panel (shows when hovering category) */}
                      <div className="col-span-6 border-l border-stone-100 pl-6">
                        {activeMegaMenu && megaMenuConfig[activeMegaMenu] ? (
                          <>
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Shop {mainCategories.find(c => c.categoryId === activeMegaMenu)?.name}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              {megaMenuConfig[activeMegaMenu].map((group) => (
                                <div key={group.title}>
                                  <h4 className="mb-2 text-xs font-medium text-stone-400">
                                    {group.title}
                                  </h4>
                                  <ul className="space-y-1">
                                    {group.items.map((item) => (
                                      <li key={item.name}>
                                        <Link
                                          href={item.href}
                                          onClick={() => setShopOpen(false)}
                                          className="block rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-stone-50 hover:text-slate-900"
                                        >
                                          {item.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-center py-8">
                            <div className="text-4xl mb-3">👕</div>
                            <h3 className="text-lg font-semibold text-slate-900">Browse Our Catalog</h3>
                            <p className="text-sm text-slate-500 mt-1">Hover over a category to explore subcategories</p>
                            <Link
                              href="/catalog"
                              onClick={() => setShopOpen(false)}
                              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                            >
                              View All Products
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        )}
                      </div>
                      
                      {/* Brands Column */}
                      <div className="col-span-3 border-l border-stone-100 pl-6">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Popular Brands
                        </h3>
                        <div className="space-y-1">
                          {popularBrands.slice(0, 8).map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/catalog?brand=${brand.id}`}
                              onClick={() => setShopOpen(false)}
                              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-stone-50 hover:text-slate-900"
                            >
                              {brand.image && (
                                <Image
                                  src={brand.image}
                                  alt={brand.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                />
                              )}
                              <span className="truncate">{brand.name}</span>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/brands"
                          onClick={() => setShopOpen(false)}
                          className="mt-3 block text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          All {brands.length} brands →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Services Dropdown - PROMINENT */}
              <div 
                className="relative" 
                ref={servicesRef}
                onMouseEnter={handleServicesEnter}
                onMouseLeave={handleServicesLeave}
              >
                <Link
                  href="/services"
                  onClick={() => setServicesOpen(false)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    servicesOpen || pathname.startsWith('/services')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-brand-600 hover:bg-brand-50 hover:text-brand-700'
                  )}
                >
                  Services
                  <ChevronDown className={cn('h-4 w-4 transition-transform', servicesOpen && 'rotate-180')} />
                </Link>

                {servicesOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-[480px] rounded-xl bg-white p-6 shadow-xl ring-1 ring-stone-200">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Screen Printing Hub */}
                      <div className="col-span-2 rounded-lg bg-stone-50 p-4">
                        <Link
                          href={servicesMenu.screenPrinting.href}
                          onClick={() => setServicesOpen(false)}
                          className="flex items-start gap-3 group"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
                            <Layers className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 group-hover:text-brand-600">
                              {servicesMenu.screenPrinting.title}
                            </h3>
                            <p className="text-xs text-slate-500">{servicesMenu.screenPrinting.description}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-brand-500" />
                        </Link>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {servicesMenu.screenPrinting.subItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setServicesOpen(false)}
                                className="flex items-center gap-2 rounded-md p-2 text-sm text-slate-600 hover:bg-white hover:text-slate-900"
                              >
                                <Icon className="h-4 w-4 text-stone-400" />
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      {/* Embroidery */}
                      <Link
                        href={servicesMenu.embroidery.href}
                        onClick={() => setServicesOpen(false)}
                        className="flex items-start gap-3 rounded-lg p-3 hover:bg-stone-50 group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <Scissors className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-brand-600">
                            {servicesMenu.embroidery.title}
                          </h3>
                          <p className="text-xs text-slate-500">{servicesMenu.embroidery.description}</p>
                        </div>
                      </Link>

                      {/* Retail Finishing */}
                      <Link
                        href={servicesMenu.finishing.href}
                        onClick={() => setServicesOpen(false)}
                        className="flex items-start gap-3 rounded-lg p-3 hover:bg-stone-50 group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-brand-600">
                            {servicesMenu.finishing.title}
                          </h3>
                          <p className="text-xs text-slate-500">{servicesMenu.finishing.description}</p>
                        </div>
                      </Link>

                      {/* Rush - Full Width Highlight */}
                      <Link
                        href={servicesMenu.rush.href}
                        onClick={() => setServicesOpen(false)}
                        className="col-span-2 flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3 hover:bg-amber-100 group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-800 group-hover:text-amber-900">
                            {servicesMenu.rush.title}
                          </h3>
                          <p className="text-xs text-amber-600">{servicesMenu.rush.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-amber-400 group-hover:text-amber-600" />
                      </Link>

                      {/* Large Orders */}
                      <Link
                        href={servicesMenu.largeOrders.href}
                        onClick={() => setServicesOpen(false)}
                        className="col-span-2 flex items-center gap-3 rounded-lg p-3 hover:bg-stone-50 group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-800 text-white">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 group-hover:text-brand-600">
                            {servicesMenu.largeOrders.title}
                          </h3>
                          <p className="text-xs text-slate-500">{servicesMenu.largeOrders.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-500" />
                      </Link>
                    </div>

                    {/* Package Deals Section - Hidden for now, needs polish
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Quick Start
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href="/packages"
                          onClick={() => setServicesOpen(false)}
                          className="flex items-center gap-3 rounded-lg bg-brand-50 border border-brand-100 p-3 hover:bg-brand-100 group"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
                            <Star className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-brand-700 text-sm">Package Deals</h4>
                            <p className="text-xs text-brand-600">Pre-built packages</p>
                          </div>
                        </Link>
                        <Link
                          href="/samples"
                          onClick={() => setServicesOpen(false)}
                          className="flex items-center gap-3 rounded-lg bg-stone-50 border border-stone-200 p-3 hover:bg-stone-100 group"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-600 text-white">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-700 text-sm">Sample Packs</h4>
                            <p className="text-xs text-slate-500">Try before you buy</p>
                          </div>
                        </Link>
                      </div>
                    </div>
                    */}

                    {/* View All Services Link */}
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <Link
                        href="/services"
                        onClick={() => setServicesOpen(false)}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        View all services
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing - Direct Link */}
              <Link
                href="/pricing"
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  pathname === '/pricing'
                    ? 'bg-stone-100 text-slate-900'
                    : 'text-slate-700 hover:bg-stone-50 hover:text-slate-900'
                )}
              >
                Pricing
              </Link>

              {/* Contact - Direct Link */}
              <Link
                href="/contact"
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  pathname === '/contact'
                    ? 'bg-stone-100 text-slate-900'
                    : 'text-slate-700 hover:bg-stone-50 hover:text-slate-900'
                )}
              >
                Contact
              </Link>
            </div>

            {/* Search Bar (desktop) */}
            <div className="hidden flex-1 max-w-md mx-6 lg:block">
              <form action="/catalog" method="GET" className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search by style # or keyword..."
                  className="w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-4 pr-10 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-brand-500 p-1.5 text-white hover:bg-brand-600"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Right side - Auth + Quote CTA */}
            <div className="hidden items-center gap-3 lg:flex">
              {/* User Menu - Sign In hidden for MVP (dashboard not ready) */}
              {!userLoading && user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                      {user.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt=""
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', userMenuOpen && 'rotate-180')} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-white p-2 shadow-xl ring-1 ring-stone-200">
                      <div className="border-b border-stone-100 px-3 py-2 mb-2">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-stone-50"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-stone-50"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <div className="border-t border-stone-100 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* TODO: Re-enable Sign In link when dashboard is ready
              {!userLoading && !user && (
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50 transition-colors"
                >
                  Sign In
                </Link>
              )}
              */}

              <button
                onClick={openDrawer}
                className={cn(
                  "relative flex items-center justify-center rounded-2xl border border-stone-200 bg-white/70 p-2.5 text-slate-600 shadow-sm shadow-brand-500/5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:text-slate-900 hover:shadow-xl hover:shadow-brand-500/10",
                  justAdded && "animate-pulse ring-2 ring-brand-200 ring-offset-1"
                )}
                aria-label="Shopping cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className={cn(
                    "absolute -right-1.5 -top-1.5 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-semibold text-white shadow-lg shadow-brand-500/30 ring-2 ring-white transition-transform",
                    itemCount > 99 ? "h-5 min-w-[1.25rem] px-1 text-[10px]" : "h-5 w-5 text-[11px]",
                    justAdded && "scale-110"
                  )}>
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile: Search + Cart + Menu buttons */}
            <div className="flex items-center gap-1 lg:hidden">
              {/* Mobile Search Icon */}
              <button
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  mobileSearchOpen
                    ? "bg-brand-50 text-brand-600"
                    : "text-slate-600 hover:bg-stone-100 hover:text-slate-900"
                )}
              >
                {mobileSearchOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Search className="h-6 w-6" />
                )}
              </button>

              {/* Mobile Cart Icon */}
              <button
                onClick={openDrawer}
                className={cn(
                  "relative rounded-2xl border border-stone-200 bg-white/70 p-2 text-slate-600 shadow-sm shadow-brand-500/5 backdrop-blur-sm transition-all duration-200 hover:text-slate-900 hover:shadow-md hover:shadow-brand-500/10",
                  justAdded && "animate-pulse ring-2 ring-brand-200"
                )}
                aria-label="Shopping cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className={cn(
                    "absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-semibold text-white shadow-lg shadow-brand-500/30 ring-2 ring-white transition-transform",
                    itemCount > 99 ? "h-4 min-w-[1rem] px-1 text-[9px]" : "h-4 w-4 text-[10px]",
                    justAdded && "scale-110"
                  )}>
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setMobileSearchOpen(false);
                }}
                className="rounded-lg p-2 text-slate-600 hover:bg-stone-100 hover:text-slate-900"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="border-t border-stone-100 bg-white px-4 py-3 lg:hidden">
            <form action="/catalog" method="GET" className="relative">
              <input
                ref={mobileSearchInputRef}
                type="text"
                name="search"
                placeholder="Search by style # or keyword..."
                className="w-full rounded-full border border-stone-200 bg-stone-50 py-3 pl-4 pr-12 text-base focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-500 p-2 text-white hover:bg-brand-600 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-stone-100 py-4 lg:hidden max-h-[calc(100vh-8rem)] overflow-y-auto">
            {/* Mobile Search */}
            <form action="/catalog" method="GET" className="mb-4 px-4">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 py-3 pl-4 pr-12 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand-500 p-2 text-white hover:bg-brand-600"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Mobile Nav Items */}
            <div className="space-y-1 px-4">
              {/* Shop Section */}
              <p className="py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Shop
              </p>
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-stone-50"
              >
                All Products
              </Link>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {mainCategories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-stone-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              {/* Services Section - Prominent */}
              <div className="border-t border-stone-100 pt-3 mt-3">
                <p className="py-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
                  Services
                </p>
                <Link
                  href="/services/screen-printing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <Layers className="h-4 w-4 text-brand-500" />
                  Screen Printing
                </Link>
                <Link
                  href="/services/embroidery"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <Scissors className="h-4 w-4 text-indigo-500" />
                  Embroidery
                </Link>
                <Link
                  href="/services/retail-finishing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <Package className="h-4 w-4 text-amber-500" />
                  Retail Finishing
                </Link>
                <Link
                  href="/services/rush"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg my-2 px-3 py-2.5 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                >
                  <Zap className="h-4 w-4 text-amber-500" />
                  Rush Turnaround
                </Link>
                <Link
                  href="/services/large-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <Package className="h-4 w-4 text-navy-600" />
                  Large Orders (500+)
                </Link>
                <Link
                  href="/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  View all services →
                </Link>
              </div>

              {/* Package Deals Section - Mobile - Hidden for now, needs polish
              <div className="border-t border-stone-100 pt-3 mt-3">
                <p className="py-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
                  Quick Start
                </p>
                <Link
                  href="/packages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg my-1 px-3 py-2.5 text-sm font-medium text-brand-800 bg-brand-50 border border-brand-200 hover:bg-brand-100"
                >
                  <Star className="h-4 w-4 text-brand-500" />
                  Package Deals
                </Link>
                <Link
                  href="/samples"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <Package className="h-4 w-4 text-stone-500" />
                  Sample Packs
                </Link>
              </div>
              */}

              {/* Quick Links */}
              <div className="border-t border-stone-100 pt-3 mt-3">
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-stone-50"
                >
                  Pricing Calculator
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-stone-50"
                >
                  Contact Us
                </Link>
              </div>

              {/* Resources Section */}
              <div className="border-t border-stone-100 pt-3 mt-3">
                <p className="py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Resources
                </p>
                <Link
                  href="/resources/screen-printing-guide"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <BookOpen className="h-4 w-4 text-brand-500" />
                  Screen Printing Guide
                </Link>
                <Link
                  href="/resources/embroidery-guide"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  Embroidery Guide
                </Link>
                <Link
                  href="/guides"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  Product Guides
                </Link>
                <Link
                  href="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <HelpCircle className="h-4 w-4 text-stone-400" />
                  FAQ
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <Users className="h-4 w-4 text-stone-400" />
                  About Us
                </Link>
              </div>

              {/* Popular Brands */}
              <div className="border-t border-stone-100 pt-3 mt-3">
                <p className="py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Popular Brands
                </p>
                {popularBrands.slice(0, 6).map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/catalog?brand=${brand.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-stone-50"
                  >
                    {brand.image && (
                      <Image
                        src={brand.image}
                        alt={brand.name}
                        width={20}
                        height={20}
                        className="rounded"
                      />
                    )}
                    {brand.name}
                  </Link>
                ))}
                <Link
                  href="/catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-brand-600"
                >
                  View all brands →
                </Link>
              </div>

              {/* Auth Section - Sign In hidden for MVP (dashboard not ready) */}
              {!userLoading && user && (
                <div className="border-t border-stone-100 pt-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                        {user.user_metadata?.avatar_url ? (
                          <Image
                            src={user.user_metadata.avatar_url}
                            alt=""
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-stone-50"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
              {/* TODO: Re-enable when dashboard is ready
              {!userLoading && !user && (
                <div className="border-t border-stone-100 pt-4 mt-4">
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-stone-50"
                    >
                      <User className="h-4 w-4" />
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              )}
              */}

              {/* Call CTA */}
              <div className="border-t border-stone-100 pt-4 mt-4">
                <PhoneButton
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#070131] px-4 py-3 text-sm font-medium text-white hover:bg-[#0f0652]"
                  iconClassName="h-4 w-4"
                />
                <p className="mt-2 text-center text-xs text-slate-500">
                  Average wait: 10-30 seconds
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
