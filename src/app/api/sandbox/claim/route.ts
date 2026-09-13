import { NextResponse } from 'next/server';
import { appPool } from '@/lib/db';

// pg needs TCP sockets, which the edge runtime doesn't have.
export const runtime = 'nodejs';

// Frankfurt, matching the Neon region. A mismatch adds a round trip per query.
export const preferredRegion = 'fra1';

const COOKIE = 'sandbox';
const IDLE_MINUTES = Number(process.env.SANDBOX_IDLE_MINUTES ?? 30);

type Claim = {
  claimed_token: string;
  claimed_schema: string;
};

export async function POST() {
  try {
    const { rows } = await appPool.query<Claim>(
      'SELECT claimed_token, claimed_schema FROM public.claim_sandbox($1)',
      [IDLE_MINUTES],
    );

    // No rows means every sandbox is in use, which isn't a server fault.
    const claim = rows[0];
    if (!claim) {
      return NextResponse.json(
        { error: 'Every sandbox is busy right now. Try again in a minute.' },
        { status: 503 },
      );
    }

    const response = NextResponse.json({ ok: true });

    // HttpOnly keeps the token away from any script running on the page.
    response.cookies.set(COOKIE, claim.claimed_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Could not start a sandbox.' },
      { status: 500 },
    );
  }
}
