import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { TourStatus } from "../../../generated/prisma/enums";
import {
  Users,
  Map as MapIcon,
  Calendar,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

// --- Components ---

function StatCard({ title, value, desc, icon: Icon, color }: any) {
  return (
    <div className="stats shadow bg-base-100 border border-base-200">
      <div className="stat">
        <div className={`stat-figure text-${color}`}>
          <Icon size={32} />
        </div>
        <div className="stat-title">{title}</div>
        <div className={`stat-value text-${color}`}>{value}</div>
        <div className="stat-desc">{desc}</div>
      </div>
    </div>
  );
}

function QuickAction({ title, href, icon: Icon }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 bg-base-100 border border-base-200 rounded-xl hover:shadow-md hover:border-primary transition-all group"
    >
      <div className="p-3 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
        <Icon size={20} />
      </div>
      <span className="font-medium">{title}</span>
    </Link>
  );
}

// Helper for status badges
function getStatusBadge(status: TourStatus) {
  switch (status) {
    case TourStatus.CONFIRMED:
    case TourStatus.ACTIVE:
      return "badge-success";
    case TourStatus.DRAFT:
    case TourStatus.DESIGNED:
      return "badge-ghost";
    case TourStatus.AGENCY_REVIEW:
    case TourStatus.PAYMENT_PENDING:
      return "badge-warning";
    case TourStatus.COMPLETED:
      return "badge-info";
    default:
      return "badge-neutral";
  }
}

// --- Main Page ---

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userRole = session.user.role;

  // 1. ADMIN DASHBOARD
  if (userRole === "ADMIN" || userRole === "MANAGER") {
    // Fetch Data in Parallel
    const [tourCount, clientCount, recentTours] = await Promise.all([
      prisma.tour.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.tour.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        // 👇 FIX: We include the summary table to get the counts
        include: {
          participantSummary: true,
        },
      }),
    ]);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-base-content/60">
              Overview of your agency's performance.
            </p>
          </div>
          <div className="text-sm text-base-content/40">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tours"
            value={tourCount}
            desc="Active & Drafts"
            icon={MapIcon}
            color="primary"
          />
          <StatCard
            title="Active Clients"
            value={clientCount}
            desc="Registered users"
            icon={Users}
            color="secondary"
          />
          <StatCard
            title="Revenue"
            value="$0"
            desc="Year to Date"
            icon={TrendingUp}
            color="success"
          />
          <StatCard
            title="Upcoming"
            value="0"
            desc="Departing soon"
            icon={Calendar}
            color="warning"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Tours</h2>
              <Link
                href="/dashboard/tours"
                className="btn btn-ghost btn-sm text-primary"
              >
                View All <ArrowRight size={16} />
              </Link>
            </div>

            <div className="overflow-x-auto bg-base-100 border border-base-200 rounded-xl shadow-sm">
              <table className="table">
                <thead>
                  <tr className="bg-base-200/50">
                    <th>Name</th>
                    <th>Status</th>
                    <th>Total Pax</th> {/* Renamed to match your schema */}
                    <th>Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTours.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-12 text-base-content/50"
                      >
                        <MapIcon
                          className="mx-auto mb-2 opacity-20"
                          size={32}
                        />
                        No tours created yet.
                        <br />
                        <Link
                          href="/dashboard/tours/new"
                          className="link link-primary text-sm mt-2"
                        >
                          Create your first tour
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    recentTours.map((tour) => (
                      <tr
                        key={tour.id}
                        className="hover:bg-base-200/30 transition-colors cursor-pointer"
                      >
                        <td className="font-medium">
                          {tour.name}
                          <div className="text-xs text-base-content/40 font-normal">
                            {tour.destination}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`badge badge-sm ${getStatusBadge(tour.status)}`}
                          >
                            {tour.status.replace(/_/g, " ")}
                          </div>
                        </td>
                        {/* 👇 FIX: Access data from participantSummary */}
                        <td className="text-center font-mono">
                          {tour.participantSummary?.totalPax || 0}
                        </td>
                        <td className="text-xs text-base-content/60">
                          {new Date(tour.startDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Column */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              <QuickAction
                title="Create New Tour"
                href="/dashboard/tours/new"
                icon={Plus}
              />
              <QuickAction
                title="Register Client"
                href="/dashboard/users/new"
                icon={Users}
              />
              <QuickAction
                title="Add Resource"
                href="/dashboard/resources"
                icon={MapIcon}
              />
            </div>

            {/* System Status */}
            <div className="card bg-neutral text-neutral-content mt-6 shadow-xl">
              <div className="card-body p-6 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <TrendingUp size={100} />
                </div>

                <h3 className="card-title text-sm opacity-80">System Health</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></div>
                  <span className="font-mono text-xs font-bold text-success">
                    OPERATIONAL
                  </span>
                </div>
                <div className="text-xs opacity-50 mt-2">
                  Database connected
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. CLIENT DASHBOARD (Simplified for now)
  return (
    <div className="hero min-h-[60vh] bg-base-100 rounded-box border border-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-primary">
            Hello, {session.user.name}
          </h1>
          <p className="py-6 text-lg opacity-80">
            Welcome to your travel portal. Your upcoming trips and documents
            will appear here.
          </p>
          <button className="btn btn-primary shadow-lg shadow-primary/30">
            Browse Packages
          </button>
        </div>
      </div>
    </div>
  );
}
