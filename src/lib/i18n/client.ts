import canonicalCatalog from './catalog.en-US.json';

export function normalizeLocale(locale: string): string {
  const trimmed = (locale || '').trim();
  if (!trimmed) return 'en-US';
  const parts = trimmed.split(/[-_]/);
  if (parts.length === 1) {
    const lang = parts[0].toLowerCase();
    if (lang === 'en') return 'en-US';
    if (lang === 'es') return 'es-PR'; // Default es to es-PR for our app context
    return trimmed;
  }
  const lang = parts[0].toLowerCase();
  const region = parts[1].toUpperCase();
  return `${lang}-${region}`;
}

export async function getClientActiveCatalog(locale: string): Promise<Record<string, string>> {
  const norm = normalizeLocale(locale);
  if (norm === 'en-US') {
    return canonicalCatalog;
  }

  // Attempt REST fetch using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jmtwkiizirfussizdjmh.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdHdraWl6aXJmdXNzaXpkam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDQ0MjksImV4cCI6MjA5NjUyMDQyOX0.3U9I9dK9Es8Sz6q5CVEGHrCQ-LM3_sX802PriQmNeZ4';

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const localeUrl = `${supabaseUrl}/rest/v1/localization_locales?tenant_id=eq.adme&locale_code=eq.${encodeURIComponent(norm)}&select=active_version_id`;
      const resLocale = await fetch(localeUrl, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      if (resLocale.ok) {
        const locales = await resLocale.json();
        const activeVersionId = locales[0]?.active_version_id;
        if (activeVersionId) {
          const versionUrl = `${supabaseUrl}/rest/v1/localization_catalog_versions?tenant_id=eq.adme&id=eq.${encodeURIComponent(activeVersionId)}&select=messages,state`;
          const resVersion = await fetch(versionUrl, {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
          });

          if (resVersion.ok) {
            const versions = await resVersion.json();
            const version = versions[0];
            if (version && (version.state === 'active' || version.state === 'stale')) {
              const messages = typeof version.messages === 'string' ? JSON.parse(version.messages) : version.messages;
              return messages;
            }
          }
        }
      }
    } catch (err) {
      console.error('REST client catalog fetch failed:', err);
    }
  }

  // Fallback to local catalog if REST fails (or offline)
  return canonicalCatalog;
}
