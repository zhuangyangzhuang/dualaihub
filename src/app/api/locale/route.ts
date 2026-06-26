import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const locale = request.cookies.get('locale')?.value || 'en';
  return NextResponse.json({ locale });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { locale } = body;
  
  if (!locale || !['en', 'zh'].includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }
  
  const response = NextResponse.json({ locale });
  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
  });
  
  return response;
}