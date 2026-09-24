import { supabase } from './supabase.js';

window.__adminReady = (async () => {
    // Supabase restores the persisted session automatically.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        window.location.replace('login.html');
        return false;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role,name')
        .eq('id', session.user.id)
        .maybeSingle();

    // IMPORTANT:
    // Never call signOut() merely because the profile request failed.
    // A database/RLS/network error must not erase the user's saved login.
    if (profileError) {
        console.error('Could not load admin profile:', profileError);
        window.__adminUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || 'Admin'
        };
        return true;
    }

    // Only deny access when the profile is actually present and explicitly
    // says this user is not an admin.
    if (profile && profile.role !== 'admin') {
        window.location.replace('login.html');
        return false;
    }

    // If the profile row is temporarily unavailable, keep the valid session.
    window.__adminUser = {
        id: session.user.id,
        email: session.user.email || '',
        name: profile?.name || session.user.user_metadata?.name || session.user.email || 'Admin'
    };

    return true;
})();
