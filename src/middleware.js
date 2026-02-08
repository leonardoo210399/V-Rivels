import { NextResponse } from 'next/server'

export async function middleware(request) {
  // Check maintenance mode via Appwrite REST API
  // We use fetch because node-appwrite might not be fully compatible with Edge runtime in all cases,
  // and a simple GET request is lighter.
  let maintenanceMode = false;
  
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    
    // Hardcoded for now based on appwrite.js constants
    const SETTINGS_COLLECTION_ID = "site_settings"; 
    const GLOBAL_SETTINGS_DOC_ID = "global";

    if (endpoint && projectId && dbId && apiKey) {
        const response = await fetch(
            `${endpoint}/databases/${dbId}/collections/${SETTINGS_COLLECTION_ID}/documents/${GLOBAL_SETTINGS_DOC_ID}`,
            {
                headers: {
                    'X-Appwrite-Project': projectId,
                    'X-Appwrite-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                next: { revalidate: 60 } // Cache for 60 seconds to reduce load
            }
        );

        if (response.ok) {
            const data = await response.json();
            maintenanceMode = data.maintenanceMode === true;
        }
    }
  } catch (error) {
    console.error("Middleware Check Failed:", error);
    // Fallback to false in case of error to keep site up
  }

  // Fallback to Env Var if API check fails or isn't set up yet
  if (!maintenanceMode) {
      maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  }

  const { pathname, searchParams } = request.nextUrl
  
  // Define paths that used to bypass maintenance mode
  const publicPaths = [
    '/_next',
    '/static',
    '/api', // Optional: decide if API should be accessible
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/admin', // Clean admin path
    '/login'  // Allow login
  ]

  // Check if current path is a public path or a file
  // Also allow access to admin routes to toggle it back off!
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname.includes('.')

  // Check for bypass mechanism
  const bypassSecret = searchParams.get('secret')
  const bypassCookie = request.cookies.get('maintenance_bypass')
  const isBypassed = bypassSecret === 'dev_bypass' || bypassCookie?.value === 'true'

  // If requesting bypass with secret, set cookie and redirect to same URL without secret
  if (bypassSecret === 'dev_bypass') {
    const url = request.nextUrl.clone()
    url.searchParams.delete('secret')
    const response = NextResponse.redirect(url)
    response.cookies.set('maintenance_bypass', 'true', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 }) // 24 hours
    return response
  }

  // Handle Maintenance Mode
  if (maintenanceMode && !isBypassed && !isPublicPath) {
    if (pathname !== '/maintenance') {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  } else {
    // If NOT in maintenance mode (or bypassed), redirect away from maintenance page if accessed directly
    if (pathname === '/maintenance') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
