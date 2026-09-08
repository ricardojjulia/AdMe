import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      const { data: { user } } = await supabase.auth.getUser()
      const role = user?.user_metadata?.account_type || 'consumer'
      const destination = role === 'business' ? '/studio' : '/onboarding'
      return NextResponse.redirect(`${origin}${destination}`)
    } else {
      console.error('exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
