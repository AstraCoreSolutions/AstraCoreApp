import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Clients</h1>
      {clients && clients.length > 0 ? (
        <ul className="space-y-2">
          {clients.map((client: any) => (
            <li key={client.id} className="border p-2 rounded">
              {client.name || client.email || client.id}
            </li>
          ))}
        </ul>
      ) : (
        <p>No clients found.</p>
      )}
    </div>
  );
}
