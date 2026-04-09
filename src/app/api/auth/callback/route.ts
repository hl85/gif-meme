import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGoogleToken, getGoogleUser } from '@/lib/auth/oauth';
import { setSession } from '@/lib/auth/session';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAppBaseUrl } from '@/lib/runtime/base-url';

function redirectWithError(request: NextRequest, errorCode: string) {
  return NextResponse.redirect(new URL(`/?error=${errorCode}`, request.url));
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (!code || !state) {
    return redirectWithError(request, 'missing_params');
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;

  if (!savedState || savedState !== state) {
    return redirectWithError(request, 'invalid_state');
  }

  cookieStore.delete('oauth_state');

  const redirectUri = `${getAppBaseUrl()}/api/auth/callback`;
  console.info('[auth][google-callback] redirect_uri', {
    redirectUri,
    hasCode: Boolean(code),
    hasState: Boolean(state),
  });

  let tokenData: Awaited<ReturnType<typeof getGoogleToken>>;
  try {
    tokenData = await getGoogleToken(code);
  } catch (err) {
    console.error('[auth][google-callback] token_exchange_failed', {
      redirectUri,
      message: getSafeErrorMessage(err),
    });
    return redirectWithError(request, 'token_exchange_failed');
  }

  let googleUser: Awaited<ReturnType<typeof getGoogleUser>>;
  try {
    googleUser = await getGoogleUser(tokenData.access_token);
  } catch (err) {
    console.error('[auth][google-callback] user_info_failed', {
      redirectUri,
      message: getSafeErrorMessage(err),
    });
    return redirectWithError(request, 'user_info_failed');
  }

  let user: typeof users.$inferSelect | undefined;
  try {
    const { env } = await getCloudflareContext();
    const d1Binding = env.main_db || (env as any)['main-db'];
    if (!d1Binding) {
      throw new Error('D1 binding not found: expected env.main_db or env["main-db"]');
    }
    const db = drizzle(d1Binding);

    user = await db.select().from(users).where(eq(users.googleId, googleUser.id)).get();

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

    if (!user) {
      throw new Error('User record unavailable after OAuth DB flow');
    }
  } catch (err) {
    console.error('[auth][google-callback] db_error', {
      redirectUri,
      message: getSafeErrorMessage(err),
    });
    return redirectWithError(request, 'db_error');
  }

  try {
    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      googleId: user.googleId,
    });
  } catch (err) {
    console.error('[auth][google-callback] session_error', {
      redirectUri,
      message: getSafeErrorMessage(err),
    });
    return redirectWithError(request, 'session_error');
  }

  return NextResponse.redirect(new URL('/', request.url));
}
