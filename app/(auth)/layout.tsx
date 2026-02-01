import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-stone-50">
      {/* Subtle grain texture overlay */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none fixed top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-96 w-96 translate-y-1/2 -translate-x-1/2 rounded-full bg-navy-800/5 blur-3xl" />
      
      {/* Main content */}
      <div className="relative flex min-h-screen flex-col items-center px-4 pt-12 pb-8 sm:pt-20">
        {/* Logo */}
        <Link href="/" className="mb-8">
          <Image
            src="/images/brand/logo-wordmark-dark.svg"
            alt="Garment Decor"
            width={180}
            height={40}
            priority
          />
        </Link>
        
        {/* Auth card */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-stone-200/60 bg-white/80 p-8 shadow-xl shadow-stone-200/50 backdrop-blur-sm">
            {children}
          </div>
          
          {/* Footer links */}
          <div className="mt-6 text-center text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-600 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
