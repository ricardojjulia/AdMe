import { vi } from 'vitest'

// Mock next/cache — revalidatePath/revalidateTag throw in test context
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag:  vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter:   () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams:   () => ({}),
  usePathname: () => '/',
  redirect:    vi.fn(),
}))

// Mock the database clients globally
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockReturnValue({
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
    }),
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockReturnValue({
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
    }),
  }),
}))
