import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Calendar, MapPin, User, ArrowRight, DollarSign } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

export default async function TourOverviewPage({ params }: { params: { tourId: string } }) {
    const tour = await prisma.tour.findUnique({
        where: { id: params.tourId },
        include: {
            client: true,
            financials: true,
            participantSummary: true,
            _count: { select: { itinerary: true } }
        }
    });

    if (!tour) notFound();

    // Calculate some quick stats
    const completionPercent = tour.status === 'DRAFT' ? 25 : tour.status === 'CONFIRMED' ? 100 : 50;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 1. STATUS CARD */}
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
                <div className="card-body p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="card-title text-2xl mb-1">Trip Overview</h2>
                            <p className="text-base-content/60 text-sm">
                                Managed by {tour.creatorId ? "You" : "Agency"} • Created on {new Date(tour.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50">Status</span>
                            <div className="badge badge-primary badge-lg">{tour.status.replace(/_/g, " ")}</div>
                        </div>
                    </div>

                    <div className="divider my-4"></div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Dates */}
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-base-50 border border-base-200/50">
                            <div className="p-3 bg-white rounded-lg shadow-sm text-primary">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase text-base-content/40">Travel Dates</div>
                                <div className="font-semibold text-sm">
                                    {new Date(tour.startDate).toLocaleDateString()}
                                    <span className="mx-2 text-base-content/30">→</span>
                                    {new Date(tour.endDate).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-base-content/50 mt-0.5">{tour.duration} Days</div>
                            </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-base-50 border border-base-200/50">
                            <div className="p-3 bg-white rounded-lg shadow-sm text-secondary">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase text-base-content/40">Route</div>
                                <div className="font-semibold text-sm truncate max-w-[180px]">{tour.startLocation}</div>
                                <div className="text-xs text-base-content/50 mt-0.5">To {tour.destination}</div>
                            </div>
                        </div>

                        {/* Client */}
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-base-50 border border-base-200/50">
                            <div className="p-3 bg-white rounded-lg shadow-sm text-accent">
                                <User size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase text-base-content/40">Main Client</div>
                                <div className="font-semibold text-sm">
                                    {tour.client?.name || "Not Assigned"}
                                </div>
                                <div className="text-xs text-base-content/50 mt-0.5">
                                    {tour.client?.email || "No contact info"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ACTION GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Itinerary Progress */}
                <div className="card bg-base-100 border border-base-200 shadow-sm hover:border-primary/50 transition-colors group cursor-pointer">
                    <Link href={`/dashboard/tours/${tour.id}/itinerary`} className="card-body p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <MapPin size={20} className="text-primary" /> Itinerary
                            </h3>
                            <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </div>
                        <div className="w-full bg-base-200 rounded-full h-2 mb-2">
                            <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{ width: `${completionPercent}%` }}></div>
                        </div>
                        <p className="text-sm text-base-content/60">
                            {tour._count.itinerary} days planned. Click to add activities, hotels, and notes.
                        </p>
                    </Link>
                </div>

                {/* Financial Snapshot */}
                <div className="card bg-base-100 border border-base-200 shadow-sm hover:border-success/50 transition-colors group cursor-pointer">
                    <Link href={`/dashboard/tours/${tour.id}/financials`} className="card-body p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <DollarSign size={20} className="text-success" /> Financials
                            </h3>
                            <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-success" />
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <div className="text-xs uppercase text-base-content/40 font-bold">Cost</div>
                                <div className="font-mono text-lg text-base-content/70">{formatCurrency(Number(tour.financials?.budget || 0))}</div>
                            </div>
                            <div className="divider divider-horizontal mx-0"></div>
                            <div>
                                <div className="text-xs uppercase text-base-content/40 font-bold">Sales</div>
                                <div className="font-mono text-lg font-bold text-success">{formatCurrency(Number(tour.financials?.sellingPrice || 0))}</div>
                            </div>
                        </div>
                    </Link>
                </div>

            </div>
        </div>
    );
}