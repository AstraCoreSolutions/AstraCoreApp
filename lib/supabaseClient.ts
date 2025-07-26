import { createClient } from '@supabase/supabase-js';

// Read environment variables at runtime.  When deploying to Netlify, these
// variables must be configured in the Netlify UI.  In local development
// create a `.env.local` file based on `.env.example`.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.  Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Create a single supabase client for the entire app.  This client
// manages authentication state on the client side.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
