import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/admin', '/sales'];

// Routes only for unauthenticated users
const authRoutes = ['/login', '/signup', '/forgot-password'];

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/sales': ['admin', 'sales_rep'],
};

export async function middleware(request: NextRequest) {
  // Forward the original pathname + search string to downstream server
  // components via request headers. `app/not-found.tsx` reads these so
  // it can look up a redirect for the URL the visitor actually requested
  // (Next.js doesn't expose that to the not-found component otherwise).
  //
  // No DB hits and no awaitable work here — keeping middleware fast.
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set('x-invoke-path', request.nextUrl.pathname);
  forwardedHeaders.set('x-invoke-search', request.nextUrl.search);

  let response = NextResponse.next({
    request: {
      headers: forwardedHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get the current session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is for unauthenticated users only
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Role-based access is handled at the page level for now
  // The page components check the user's role and redirect if needed
  // This avoids RLS issues in middleware context

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|api/).*)',
  ],
};
