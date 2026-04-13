import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { KlipyProvider } from '@/lib/klipy/provider';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { env } = getCloudflareContext();
    const apiKey = env.KLIPY_API_KEY as string;

    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const provider = new KlipyProvider(apiKey);
    const customerId = request.cookies.get('visitor_id')?.value;

    const data = await provider.getById(resolvedParams.id, customerId);
    
    if (!data) {
      return NextResponse.json({ error: 'GIF not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Klipy API error:', error);
    return NextResponse.json({ error: 'Failed to fetch GIF details' }, { status: 500 });
  }
}
