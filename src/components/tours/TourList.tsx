"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    Users,
    MapPin,
    Trash2,
    Eye,
    FileEdit,
    ArrowUpDown,
} from "lucide-react";
import { TourStatus } from "../../../generated/prisma/client";
import { deleteTour } from "@/actions/tours"; // We will create this action next
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface TourListProps {
    initialTours: any[];
}

export function TourList({ initialTours }: TourListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // --- FILTERING LOGIC ---
    const filteredTours = useMemo(() => {
        return initialTours.filter((tour) => {
            const matchesSearch =
                tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tour.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                filterStatus === "all" ? true : tour.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [initialTours, searchQuery, filterStatus]);

    // --- ACTIONS ---
    async function handleDelete() {
        if (!itemToDelete) return;
        const result = await deleteTour(itemToDelete);
        if (result.success) {
            toast.success("Tour package deleted");
            // Optional: Refresh data (router.refresh()) is handled by server action revalidatePath
        } else {
            toast.error("Failed to delete tour");
        }
        setItemToDelete(null);
    }

    // --- STATUS BADGE HELPER ---
    const getStatusBadge = (status: TourStatus) => {
        const styles: Record<string, string> = {
            DRAFT: "badge-ghost",
            DESIGNED: "badge-info badge-outline",
            CONFIRMED: "badge-success badge-outline",
            ACTIVE: "badge-primary animate-pulse",
            COMPLETED: "badge-neutral",
        };
        return (
            <div className={`badge badge-sm font-bold ${styles[status] || "badge-ghost"}`}>
                {status.replace(/_/g, " ")}
            </div>
        );
    };

    return (
        <div className="bg-base-100 border border-base-200 rounded-2xl shadow-sm overflow-hidden">
            {/* TOOLBAR */}
            <div className="p-4 border-b border-base-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-base-50/50">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={16} />
                    <input
                        type="text"
                        placeholder="Search tours..."
                        className="input input-sm w-full pl-9 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={14} />
                        <select
                            className="select select-sm pl-9 bg-white w-full md:w-48"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="DRAFT">Drafts</option>
                            <option value="ACTIVE">Active</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr className="bg-base-50 text-xs uppercase text-base-content/50 border-b border-base-200">
                            <th className="py-4 pl-6">Tour Details</th>
                            <th>Client</th>
                            <th>Dates</th>
                            <th>Status</th>
                            <th className="text-right pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredTours.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-16 opacity-50">
                                    No tours found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredTours.map((tour) => (
                                <tr key={tour.id} className="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-0">
                                    {/* Tour Name & Location */}
                                    <td className="pl-6 py-4">
                                        <div className="font-bold text-base-content">{tour.name}</div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-base-content/50">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={12} /> {tour.destination}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users size={12} /> {tour.participantSummary?.totalPax || 0} Pax
                                            </span>
                                        </div>
                                    </td>

                                    {/* Client */}
                                    <td>
                                        {tour.client ? (
                                            <div className="flex items-center gap-2">
                                                <div className="avatar placeholder">
                                                    <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                                                        <span className="text-xs">{tour.client.name?.charAt(0)}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-xs">{tour.client.name}</div>
                                                    <div className="text-[10px] opacity-50">{tour.client.email}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs italic opacity-40">-- No Client --</span>
                                        )}
                                    </td>

                                    {/* Dates */}
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs font-mono">
                                                <Calendar size={12} className="opacity-50" />
                                                {new Date(tour.startDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] opacity-50 ml-5">
                                                {tour._count.itinerary} Days
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td>{getStatusBadge(tour.status)}</td>

                                    {/* Actions */}
                                    <td className="text-right pr-6">
                                        <div className="join">
                                            <Link
                                                href={`/dashboard/tours/${tour.id}`}
                                                className="btn btn-sm btn-ghost join-item tooltip"
                                                data-tip="View Dashboard"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                            <Link
                                                href={`/dashboard/tours/${tour.id}/itinerary`}
                                                className="btn btn-sm btn-ghost join-item tooltip"
                                                data-tip="Edit Itinerary"
                                            >
                                                <FileEdit size={16} />
                                            </Link>
                                            <button
                                                onClick={() => setItemToDelete(tour.id)}
                                                className="btn btn-sm btn-ghost text-error join-item tooltip"
                                                data-tip="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={!!itemToDelete}
                title="Delete Tour Package?"
                message="This action cannot be undone. All itinerary data and financials will be removed."
                isDanger
                onConfirm={handleDelete}
                onCancel={() => setItemToDelete(null)}
            />
        </div>
    );
}