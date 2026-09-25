import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Disable access to /hq (Council HQ)
  if (request.nextUrl.pathname.startsWith('/hq')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url_here') {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // If request contains an auth confirmation code directed to root or another page, route to /auth/callback
    if (request.nextUrl.searchParams.has('code') && !request.nextUrl.pathname.startsWith('/auth/callback')) {
      const callbackUrl = request.nextUrl.clone()
      callbackUrl.pathname = '/auth/callback'
      return NextResponse.redirect(callbackUrl)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const role = user?.user_metadata?.account_type || 'consumer';

  // Protect /rewards (only for consumers)
  if (request.nextUrl.pathname.startsWith('/rewards')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (role !== 'consumer') {
      const url = request.nextUrl.clone()
      url.pathname = '/studio'
      return NextResponse.redirect(url)
    }
  }

  // Protect /studio (only for business accounts)
  if (request.nextUrl.pathname.startsWith('/studio')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (role !== 'business') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Redirect if logged in and trying to access login page
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = role === 'business' ? '/studio' : '/'
    return NextResponse.redirect(url)
  }
  } catch {
    // If Supabase client fails to initialize or network error occurs, fall through cleanly
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
