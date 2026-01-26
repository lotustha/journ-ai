import { Sidebar } from "@/components/layout/Sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Menu } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Define safe user object to pass to client component
  const user = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role || "CLIENT",
  };

  return (
    // DaisyUI Drawer Component
    <div className="drawer lg:drawer-open bg-base-100">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />

      {/* --- Page Content --- */}
      <div className="drawer-content flex flex-col min-h-screen bg-base-200/50">
        {/* Mobile Navbar (Only visible on small screens) */}
        <div className="w-full navbar bg-base-100 lg:hidden border-b border-base-200 px-4 sticky top-0 z-30">
          <div className="flex-none">
            <label
              htmlFor="dashboard-drawer"
              aria-label="open sidebar"
              className="btn btn-square btn-ghost"
            >
              <Menu size={24} />
            </label>
          </div>
          <div className="flex-1 px-2 mx-2 font-bold text-lg">JournAI</div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* --- Sidebar (Drawer Side) --- */}
      <div className="drawer-side z-40">
        <label
          htmlFor="dashboard-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <Sidebar user={user} />
      </div>
    </div>
  );
}
