import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { KlipyProvider } from '@/lib/klipy/provider';

export async function GET(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    const apiKey = env.KLIPY_API_KEY as string;

    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const provider = new KlipyProvider(apiKey);
    const customerId = request.cookies.get('visitor_id')?.value;

    const data = await provider.categories(customerId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Klipy API error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
