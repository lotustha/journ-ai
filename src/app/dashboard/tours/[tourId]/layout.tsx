import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
    Map,
    CalendarDays,
    Calculator,
    Settings,
    Users,
    ArrowLeft
} from "lucide-react";

export default async function TourLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { tourId: string };
}) {
    const session = await auth();
    if (!session) redirect("/login");

    // Fetch minimal tour info for the header
    const tour = await prisma.tour.findUnique({
        where: { id: params.tourId },
        select: { id: true, name: true, status: true, duration: true }
    });

    if (!tour) notFound();

    // Navigation Tabs
    const tabs = [
        { name: "Overview", href: `/dashboard/tours/${tour.id}`, icon: Map },
        { name: "Itinerary", href: `/dashboard/tours/${tour.id}/itinerary`, icon: CalendarDays },
        { name: "Financials", href: `/dashboard/tours/${tour.id}/financials`, icon: Calculator },
        { name: "Participants", href: `/dashboard/tours/${tour.id}/participants`, icon: Users },
        { name: "Settings", href: `/dashboard/tours/${tour.id}/settings`, icon: Settings },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* HEADER */}
            <div className="bg-base-100 border-b border-base-200 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/tours"
                        className="btn btn-circle btn-ghost btn-sm text-base-content/50 hover:bg-base-200"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            {tour.name}
                            <div className="badge badge-sm badge-outline opacity-50 font-mono">
                                {tour.duration} Days
                            </div>
                        </h1>
                        <div className="text-xs text-base-content/50 font-mono uppercase tracking-wide">
                            {tour.status}
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-1 bg-base-50 p-1 rounded-lg border border-base-200">
                    {tabs.map((tab) => {
                        // Check if active (simple check, can be refined with usePathname in client component)
                        // For server layout, we render them as simple links. 
                        // Ideally this would be a client component to highlight active state, 
                        // but for simplicity we keep it server-side for now.
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-white hover:shadow-sm transition-all text-base-content/70 hover:text-primary"
                            >
                                <tab.icon size={16} />
                                <span className="hidden md:inline">{tab.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* CONTENT SCROLL AREA */}
            <div className="flex-1 overflow-y-auto bg-base-50/50 p-6">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}