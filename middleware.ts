// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
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
            request.cookies.set(name, value); // Update request cookies for subsequent operations
          });
          response = NextResponse.next({ // Re-create response to apply updated cookies
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid calling `getSession()` here for performance reasons.
  // Instead, refresh the session only if it's close to expiring or invalid.
  // For simplicity in this step, we'll just ensure the client is created.
  // Actual session refresh logic can be more nuanced.
  // The main purpose of the middleware is to forward and set cookies correctly.

  // Example: Refresh session if user is logged in and token is about to expire
  // This is a more advanced pattern, for now, just setting up the client is fine.
  // await supabase.auth.getSession(); 
  
  // Ensure the /auth/callback route is handled by the middleware for PKCE flow
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    await supabase.auth.exchangeCodeForSession(request.nextUrl.searchParams.get('code')!);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
};
