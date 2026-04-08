import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { KlipyProvider } from '@/lib/klipy/provider';

export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const apiKey = env.KLIPY_API_KEY as string;
    const kv = env.cache as KVNamespace;

    if (!apiKey || !kv) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const provider = new KlipyProvider(apiKey, kv);
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);
    const customerId = request.cookies.get('visitor_id')?.value;

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
    }

    const data = await provider.search(query, page, perPage, customerId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Klipy API error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}
