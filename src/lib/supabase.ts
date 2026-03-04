import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables or provide fallback for initial code
// Note: In Vite, env variables must be prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uggepaukbgtsezgkekqh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XVjH-AduRbo4lamk60dB2w_08SP3_EQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
