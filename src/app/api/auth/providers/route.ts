import { NextResponse } from 'next/server';

export async function GET() {
  const providers = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
  };

  return NextResponse.json(providers);
}
