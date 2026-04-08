import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGoogleToken, getGoogleUser } from '@/lib/auth/oauth';
import { setSession } from '@/lib/auth/session';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/?error=missing_params', request.url));
    }

    const cookieStore = await cookies();
    const savedState = cookieStore.get('oauth_state')?.value;

    if (!savedState || savedState !== state) {
      return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
    }

    cookieStore.delete('oauth_state');

    const tokenData = await getGoogleToken(code);
    const googleUser = await getGoogleUser(tokenData.access_token);

    const { env } = await getCloudflareContext();
    const db = drizzle(env.main_db || (env as any)['main-db']);

    let user = await db.select().from(users).where(eq(users.googleId, googleUser.id)).get();

    if (!user) {
      user = await db.select().from(users).where(eq(users.email, googleUser.email)).get();
      
      if (user) {
        const [updatedUser] = await db.update(users)
          .set({ googleId: googleUser.id, avatarUrl: googleUser.picture, name: googleUser.name })
          .where(eq(users.id, user.id))
          .returning();
        user = updatedUser;
      } else {
        const [newUser] = await db.insert(users)
          .values({
            id: crypto.randomUUID(),
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture,
            googleId: googleUser.id,
          })
          .returning();
        user = newUser;
      }
    } else {
      const [updatedUser] = await db.update(users)
        .set({ avatarUrl: googleUser.picture, name: googleUser.name })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUser;
    }

    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      googleId: user.googleId,
    });

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?error=internal_error', request.url));
  }
}
