import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: {
      hasPlentyKey: !!process.env.PLENTY_ONE_KEY,
      hasPublicPlentyKey: !!process.env.NEXT_PUBLIC_PLENTY_ONE_KEY
    }
  })
} 