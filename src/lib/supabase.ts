import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

const url = env.PUBLIC_SUPABASE_URL ?? '';
const key = env.PUBLIC_SUPABASE_ANON_KEY ?? '';

// true only when real credentials are present; otherwise the app runs local-only (mock data)
export const hasSupabase = url.startsWith('http') && !url.includes('your-project') && key.length > 10;

export const supabase = createClient(
	hasSupabase ? url : 'http://localhost:54321',
	hasSupabase ? key : 'local-anon-key'
);
