import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { TourStatus } from "../../../generated/prisma/client";
import {
  Users,
  Map as MapIcon,
  TrendingUp,
  Plus,
  ArrowRight,
  MoreHorizontal,
  Briefcase,
  Plane,
  FileText,
  Calendar,
  DollarSign,
  Bell,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/format";

// --- Components ---

function StatCard({ title, value, desc, icon: Icon, colorClass, trend }: any) {
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="card-body p-6">
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10`}>
            <Icon className={colorClass.replace("bg-", "text-")} size={24} />
          </div>
          {trend && (
            <div className="badge badge-sm badge-success gap-1 bg-success/10 text-success border-none font-bold">
              <TrendingUp size={12} /> {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-black tracking-tight text-base-content">{value}</h3>
          <p className="text-sm font-medium text-base-content/60 mb-1">{title}</p>
          <p className="text-xs text-base-content/40">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, desc, href, icon: Icon, color }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-base-100 border border-base-200 rounded-xl hover:border-primary/50 hover:shadow-md hover:bg-base-50 transition-all group"
    >
      <div className={`p-3 rounded-xl bg-${color}/10 text-${color} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-bold text-sm text-base-content">{title}</h3>
        <p className="text-xs text-base-content/50">{desc}</p>
      </div>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-base-content/40">
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}

function AlertItem({ title, desc, type }: { title: string, desc: string, type: 'warning' | 'info' | 'error' }) {
  const colors = {
    warning: "bg-warning/10 text-warning border-warning/20",
    info: "bg-info/10 text-info border-info/20",
    error: "bg-error/10 text-error border-error/20"
  };
  const icons = {
    warning: AlertCircle,
    info: Bell,
    error: AlertCircle
  };
  const Icon = icons[type];

  return (
    <div className="flex gap-3 items-start p-3 rounded-lg hover:bg-base-50 transition-colors cursor-pointer border border-transparent hover:border-base-200">
      <div className={`mt-0.5 p-1.5 rounded-full ${colors[type]}`}>
        <Icon size={14} />
      </div>
      <div>
        <p className="text-sm font-bold text-base-content/90">{title}</p>
        <p className="text-xs text-base-content/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TourStatus }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-base-200 text-base-content/60",
    DESIGNED: "bg-info/10 text-info",
    AGENCY_REVIEW: "bg-warning/10 text-warning",
    PAYMENT_PENDING: "bg-error/10 text-error",
    CONFIRMED: "bg-success/10 text-success",
    ACTIVE: "bg-primary/10 text-primary animate-pulse",
    COMPLETED: "bg-neutral/10 text-neutral-content",
  };

  return (
    <span className={`badge badge-sm font-bold border-none py-2 ${styles[status] || "badge-ghost"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// --- Main Page ---

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userRole = session.user.role;

  // 1. ADMIN / MANAGER DASHBOARD
  if (userRole === "ADMIN" || userRole === "MANAGER") {

    // --- DATA FETCHING ---
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const [tourCount, clientCount, recentTours, upcomingTours, draftsCount] = await Promise.all([
      // 1. Total Tours
      prisma.tour.count(),
      // 2. Total Clients
      prisma.user.count({ where: { role: "CLIENT" } }),
      // 3. Recent Activity (Last modified)
      prisma.tour.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: { participantSummary: true, client: { select: { name: true } } },
      }),
      // 4. Upcoming Departures (Next 30 Days)
      prisma.tour.findMany({
        where: {
          startDate: { gte: today, lte: nextMonth },
          status: { in: ['CONFIRMED', 'ACTIVE'] }
        },
        orderBy: { startDate: 'asc' },
        take: 3,
        include: { participantSummary: true }
      }),
      // 5. Action Items (Drafts)
      prisma.tour.count({ where: { status: 'DRAFT' } })
    ]);

    // Calculate Active Tours
    const activeTourCount = await prisma.tour.count({
      where: { OR: [{ status: 'ACTIVE' }, { status: 'CONFIRMED' }] }
    });

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-base-content">Dashboard</h1>
            <p className="text-base-content/60 font-medium">
              Welcome back, {session.user.name?.split(' ')[0]} 👋
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" size={16} />
              <input className="input input-sm pl-9 w-full bg-base-50 border-base-200 focus:bg-white transition-colors" placeholder="Search tours, clients..." />
            </div>
            <Link href="/dashboard/tours/new" className="btn btn-primary btn-sm h-10 px-6 gap-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Plus size={18} /> New Tour
            </Link>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(0)} // Placeholder
            desc="Gross volume (YTD)"
            icon={DollarSign}
            colorClass="bg-success text-success"
            trend="+12%"
          />
          <StatCard
            title="Active Tours"
            value={activeTourCount}
            desc="Running or confirmed"
            icon={Plane}
            colorClass="bg-primary text-primary"
          />
          <StatCard
            title="Total Clients"
            value={clientCount}
            desc="Registered users"
            icon={Users}
            colorClass="bg-info text-info"
          />
          <StatCard
            title="Total Packages"
            value={tourCount}
            desc="All time inventory"
            icon={FileText}
            colorClass="bg-warning text-warning"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-8">

            {/* 1. UPCOMING DEPARTURES */}
            <section>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Calendar size={20} className="text-primary" /> Upcoming Departures
                </h2>
                <span className="text-xs font-bold text-base-content/40 uppercase tracking-widest">Next 30 Days</span>
              </div>

              {upcomingTours.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingTours.map(tour => (
                    <Link href={`/dashboard/tours/${tour.id}`} key={tour.id} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
                      <div className="card-body p-5">
                        <div className="flex justify-between items-start mb-2">
                          <div className="badge badge-sm badge-ghost font-mono text-[10px]">{new Date(tour.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                          <StatusBadge status={tour.status} />
                        </div>
                        <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">{tour.name}</h3>
                        <div className="text-xs text-base-content/50 flex items-center gap-1 mt-1">
                          <Users size={12} /> {tour.participantSummary?.totalPax || 0} Pax • {tour.destination}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-base-100 border border-dashed border-base-300 rounded-xl p-8 text-center">
                  <div className="flex justify-center mb-2 text-base-content/20"><Plane size={32} /></div>
                  <p className="text-sm text-base-content/50">No immediate departures scheduled.</p>
                </div>
              )}
            </section>

            {/* 2. RECENT ACTIVITY TABLE */}
            <section className="bg-base-100 border border-base-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-50/50">
                <h3 className="font-bold text-sm uppercase tracking-wide opacity-70">Recent Activity</h3>
                <Link href="/dashboard/tours" className="btn btn-xs btn-ghost gap-1">View All <ArrowRight size={12} /></Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="text-xs uppercase text-base-content/40 bg-base-50 border-b border-base-200">
                      <th className="py-4 pl-6">Tour Name</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Update</th>
                      <th className="pr-6 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentTours.map((tour) => (
                      <tr key={tour.id} className="hover:bg-base-50 transition-colors group border-base-100">
                        <td className="pl-6 py-4">
                          <div className="font-bold text-base-content">{tour.name}</div>
                          <div className="text-xs text-base-content/50 flex items-center gap-1 mt-0.5">
                            <MapIcon size={10} /> {tour.destination}
                          </div>
                        </td>
                        <td>
                          {tour.client?.name ? (
                            <span className="font-medium text-xs bg-base-200 px-2 py-1 rounded-md">{tour.client.name}</span>
                          ) : <span className="text-xs opacity-30 italic">--</span>}
                        </td>
                        <td><StatusBadge status={tour.status} /></td>
                        <td className="text-xs text-base-content/50 font-mono">
                          {new Date(tour.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="pr-6 text-right">
                          <Link href={`/dashboard/tours/${tour.id}`} className="btn btn-square btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="space-y-8">

            {/* 1. OPERATIONAL ALERTS (Action Center) */}
            <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5">
              <h3 className="font-bold text-sm uppercase tracking-wide opacity-70 mb-4 flex items-center gap-2">
                <Bell size={16} className="text-error" /> Action Required
              </h3>
              <div className="space-y-1">
                {draftsCount > 0 ? (
                  <AlertItem
                    title={`${draftsCount} Draft Tours`}
                    desc="Incomplete packages waiting for review."
                    type="warning"
                  />
                ) : (
                  <div className="flex gap-3 items-center p-3 text-success bg-success/5 rounded-lg border border-success/10">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold">All drafts cleared!</span>
                  </div>
                )}
                {/* Mock alerts for UI demo */}
                <AlertItem
                  title="2 Pending Payments"
                  desc="Verify bank transfers for Order #2201."
                  type="error"
                />
                <AlertItem
                  title="System Update"
                  desc="New pricing module enabled."
                  type="info"
                />
              </div>
            </div>

            {/* 2. QUICK ACTIONS */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide opacity-70 mb-4 pl-1">Quick Access</h3>
              <div className="grid grid-cols-1 gap-3">
                <ActionCard
                  title="Create Itinerary"
                  desc="Start a new tour package"
                  href="/dashboard/tours/new"
                  icon={MapIcon}
                  color="primary"
                />
                <ActionCard
                  title="Manage Inventory"
                  desc="Hotels, Vehicles, Guides"
                  href="/dashboard/resources"
                  icon={Briefcase}
                  color="secondary"
                />
                <ActionCard
                  title="Client Database"
                  desc="View & manage users"
                  href="/dashboard/users"
                  icon={Users}
                  color="accent"
                />
              </div>
            </div>

            {/* 3. SYSTEM HEALTH */}
            <div className="card bg-neutral text-neutral-content shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingUp size={80} />
              </div>
              <div className="card-body p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">System Status</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                  <span className="font-bold text-success tracking-wide text-sm">OPERATIONAL</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-[10px] opacity-50 flex items-center gap-2">
                  <Clock size={12} /> Last synced: Just now
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // 2. CLIENT DASHBOARD
  return (
    <div className="hero min-h-[60vh] bg-base-100 rounded-3xl border border-base-200 relative overflow-hidden animate-in fade-in duration-700">
      {/* Abstract Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

      <div className="hero-content text-center relative z-10">
        <div className="max-w-lg">
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-primary to-secondary text-white rounded-3xl shadow-xl rotate-3">
            <Plane size={40} />
          </div>
          <h1 className="text-5xl font-black text-base-content mb-4 tracking-tight">
            Hello, {session.user.name?.split(' ')[0]}!
          </h1>
          <p className="py-6 text-lg text-base-content/60 leading-relaxed font-medium">
            Your personal travel hub is ready. <br />
            View your upcoming adventures, documents, and invoices.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="btn btn-primary h-12 px-8 rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              Browse Packages
            </button>
            <button className="btn btn-outline h-12 px-8 rounded-xl border-base-300 hover:bg-base-200 hover:border-base-300 text-base-content">
              My Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}