import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/auth/oauth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const { url, state } = getGoogleAuthUrl();
    
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
