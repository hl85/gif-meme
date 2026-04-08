import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { writePageView } from '@/lib/analytics/collector';

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  let visitorId = request.cookies.get('visitor_id')?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    response.cookies.set('visitor_id', visitorId, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const analytics = env.gifmeme_analytics || (env as any)['gifmeme-analytics'];

    if (analytics) {
      writePageView(analytics, {
        visitorId,
        path: request.nextUrl.pathname,
        referrer: request.headers.get('referer') || '',
        userAgent: request.headers.get('user-agent') || '',
      });
    }
  } catch (error) {
    console.error('Analytics collection failed:', error);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
