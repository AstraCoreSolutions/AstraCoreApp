import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }
  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Employees</h1>
      {employees && employees.length > 0 ? (
        <ul className="space-y-2">
          {employees.map((employee: any) => (
            <li key={employee.id} className="border p-2 rounded">
              {employee.name || employee.email || employee.id}
            </li>
          ))}
        </ul>
      ) : (
        <p>No employees found.</p>
      )}
    </div>
  );
}
