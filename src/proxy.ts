import { NextResponse, type NextRequest } from 'next/server'

const BETA_COOKIE = 'beta_access'

export function proxy(request: NextRequest) {
  if (request.cookies.get(BETA_COOKIE)?.value === '1') {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/beta'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    // Tout sauf : /beta, /api, assets Next, service worker, manifest, icons, callback auth
    '/((?!beta|api|_next/static|_next/image|auth/callback|sw.js|manifest.webmanifest|icon.svg|icon-[^/]+\\.png|favicon\\.ico|robots\\.txt).*)',
  ],
}
