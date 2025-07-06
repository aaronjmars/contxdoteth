import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: 'Test API working',
    timestamp: new Date().toISOString()
  })
}

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    message: 'Test API working',
    timestamp: new Date().toISOString()
  })
}