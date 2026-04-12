import { NextResponse, type NextRequest } from 'next/server'

function getEnv(key: string): string | undefined {
  try {
    return process.env[key]
  } catch {
    return undefined
  }
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  // Bypass auth en dev local
  if (getEnv('DEV_BYPASS_AUTH') === 'true') {
    return NextResponse.next({ request })
  }

  // Sans credentials Supabase, on laisse passer
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  // Import dynamique pour eviter le crash si les vars sont absentes
  const { createServerClient } = await import('@supabase/ssr')

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Routes publiques : pas d'auth requise
  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/auth')

  // Routes onboarding : auth requise, pas de check profil
  const isOnboarding = pathname.startsWith('/onboarding')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Utilisateur connecte sur /login -> renvoyer vers /feed
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  // Onboarding accessible a tout utilisateur connecte
  if (user && isOnboarding) {
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
