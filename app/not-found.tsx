import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative">
        <span className="text-[150px] font-bold text-slate-100">404</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-stone-50 p-8">
            <Search className="h-16 w-16 text-slate-400" />
          </div>
        </div>
      </div>
      
      <h1 className="mt-8 text-3xl font-bold text-slate-900">Page Not Found</h1>
      <p className="mt-4 max-w-md text-lg text-slate-600">
        Sorry, we couldn't find the page you're looking for. 
        It might have been moved or doesn't exist.
      </p>
      
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Link href="/">
          <Button size="lg">
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </Link>
        <Link href="/catalog">
          <Button variant="secondary" size="lg">
            <Search className="mr-2 h-5 w-5" />
            Browse Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
}
