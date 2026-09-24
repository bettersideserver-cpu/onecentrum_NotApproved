import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

// Keep the admin session in browser localStorage so it survives:
// - page refreshes
// - closing/reopening the browser
// - navigating between admin pages
//
// The session will only be removed when the user explicitly clicks Logout
// (or when the browser/site data is manually cleared).
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            storage: window.localStorage,
            storageKey: 'oc-stay-admin-auth',
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        }
    }
);
