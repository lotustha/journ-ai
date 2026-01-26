"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Users,
  Settings,
  LogOut,
  CreditCard,
  Building2,
  FileText,
  Briefcase,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

type UserRole = "ADMIN" | "MANAGER" | "STAFF" | "CLIENT";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string; // We treat this as string from DB, cast to UserRole for checks
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const role = user.role as UserRole;
  const isAdmin = role === "ADMIN" || role === "MANAGER";

  // Helper to check active state
  const isActive = (path: string) => pathname === path;
  const isChildActive = (path: string) =>
    pathname.startsWith(path) && pathname !== path;

  const NavItem = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: any;
    label: string;
  }) => (
    <li>
      <Link
        href={href}
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
          isActive(href) || isChildActive(href)
            ? "bg-primary text-primary-content shadow-md shadow-primary/20"
            : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
        }`}
      >
        <Icon
          size={20}
          className={
            isActive(href)
              ? "text-primary-content"
              : "text-base-content/50 group-hover:text-base-content"
          }
        />
        {label}
      </Link>
    </li>
  );

  return (
    <aside className="bg-base-100 w-80 min-h-full flex flex-col border-r border-base-200">
      {/* 1. Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-primary to-primary-focus flex items-center justify-center text-primary-content font-bold text-xl shadow-lg shadow-primary/20">
          J
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">JournAI</h2>
          <p className="text-xs font-medium text-base-content/50 uppercase tracking-wider">
            Workspace
          </p>
        </div>
      </div>

      {/* 2. Navigation Links */}
      <ul className="menu px-4 flex-1 gap-1">
        <div className="px-4 py-2 text-xs font-bold text-base-content/40 uppercase tracking-widest mt-2">
          Overview
        </div>
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />

        {/* -- ADMIN / STAFF SECTION -- */}
        {isAdmin && (
          <>
            <div className="px-4 py-2 text-xs font-bold text-base-content/40 uppercase tracking-widest mt-6">
              Operations
            </div>
            <NavItem
              href="/dashboard/tours"
              icon={Map}
              label="Tours & Itineraries"
            />
            <NavItem
              href="/dashboard/resources"
              icon={Building2}
              label="Resources"
            />

            <div className="px-4 py-2 text-xs font-bold text-base-content/40 uppercase tracking-widest mt-6">
              Business
            </div>
            <NavItem
              href="/dashboard/finance"
              icon={CreditCard}
              label="Finance"
            />
            <NavItem
              href="/dashboard/users"
              icon={Users}
              label="Team & Clients"
            />
          </>
        )}

        {/* -- CLIENT SECTION -- */}
        {!isAdmin && (
          <>
            <div className="px-4 py-2 text-xs font-bold text-base-content/40 uppercase tracking-widest mt-6">
              My Trip
            </div>
            <NavItem
              href="/dashboard/my-tours"
              icon={Briefcase}
              label="My Packages"
            />
            <NavItem
              href="/dashboard/documents"
              icon={FileText}
              label="Documents"
            />
            <NavItem
              href="/dashboard/payments"
              icon={CreditCard}
              label="Payments"
            />
          </>
        )}
      </ul>

      {/* 3. User Footer */}
      <div className="p-4 border-t border-base-200 m-4 bg-base-200/50 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-10">
              <span className="text-sm">{user.name?.[0] || "U"}</span>
            </div>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{user.name}</p>
            <p className="text-xs text-base-content/60 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/dashboard/settings"
            className="btn btn-xs btn-ghost border border-base-300"
          >
            <Settings size={14} /> Settings
          </Link>
          <form action={logoutAction}>
            <button className="btn btn-xs btn-ghost text-error w-full border border-base-300 hover:bg-error/10 hover:border-error">
              <LogOut size={14} /> Logout
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
