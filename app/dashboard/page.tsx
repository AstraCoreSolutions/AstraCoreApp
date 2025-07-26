import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Dashboard page displayed after successful authentication.  This
 * server component checks the current user via Supabase and
 * redirects to the login page if the user is not authenticated.
 */
export default async function Dashboard() {
  // Create a Supabase client that reads the session from cookies
  const supabase = createServerComponentClient({ cookies });

  // Retrieve the current user; if not signed in, redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">Welcome, {user?.email}</p>
      {/*
        Add modules here: projects, tasks, clients, time tracking, etc.
        Each module can be implemented as a separate component or page
        under the `app/` directory using the App Router.
      */}
    </main>
  );
}
