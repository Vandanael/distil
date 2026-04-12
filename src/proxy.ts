import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Temporairement desactive pour diagnostic Netlify
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
