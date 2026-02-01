"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Calendar,
  MapPin,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";

function getTourProgress(tour: any) {
  if (tour.status !== "DRAFT") {
    return {
      percent: 100,
      step: "Completed",
      nextUrl: `/dashboard/tours/${tour.id}`,
      color: "success",
    };
  }

  const hasRoute = tour.itinerary && tour.itinerary.length > 0;
  const hasItems =
    hasRoute && tour.itinerary.some((day: any) => day.items.length > 0);

  if (!hasRoute) {
    return {
      percent: 25,
      step: "Route Planning",
      label: "Step 2: Build Route",
      nextUrl: `/dashboard/tours/${tour.id}/wizard/destinations`,
      color: "error",
    };
  }

  if (!hasItems) {
    return {
      percent: 50,
      step: "Itinerary Building",
      label: "Step 3: Add Bookings",
      nextUrl: `/dashboard/tours/${tour.id}/itinerary`,
      color: "warning",
    };
  }

  return {
    percent: 75,
    step: "Finalizing",
    label: "Step 4: Review",
    nextUrl: `/dashboard/tours/${tour.id}/itinerary`,
    color: "info",
  };
}

interface TourManagerProps {
  initialTours: any[];
}

export function TourManager({ initialTours }: TourManagerProps) {
  // STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("UPDATED_DESC");

  // --- FILTERING & SORTING LOGIC ---
  const processedTours = useMemo(() => {
    let result = [...initialTours];

    // 1. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.client?.name?.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q),
      );
    }

    // 2. Filter Status
    if (statusFilter !== "ALL") {
      if (statusFilter === "ACTIVE") {
        result = result.filter(
          (t) => t.status === "ACTIVE" || t.status === "CONFIRMED",
        );
      } else {
        result = result.filter((t) => t.status === statusFilter);
      }
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case "NAME_ASC":
          return a.name.localeCompare(b.name);
        case "DATE_ASC":
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        case "DATE_DESC":
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        case "UPDATED_DESC":
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

    return result;
  }, [initialTours, searchQuery, statusFilter, sortOrder]);

  const activeCount = initialTours.filter(
    (t) => t.status === "ACTIVE" || t.status === "CONFIRMED",
  ).length;
  const draftCount = initialTours.filter((t) => t.status === "DRAFT").length;

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER & STATS */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-base-content">
            Tour Management
          </h1>
          <p className="text-base-content/60 font-medium mt-1">
            You have{" "}
            <span className="text-primary font-bold">{activeCount} active</span>{" "}
            tours and{" "}
            <span className="text-warning font-bold">{draftCount} drafts</span>{" "}
            in progress.
          </p>
        </div>
        <Link
          href="/dashboard/tours/new"
          className="btn btn-primary shadow-lg shadow-primary/20 gap-2 rounded-xl px-6"
        >
          <Plus size={18} /> New Tour
        </Link>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full xl:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
            size={16}
          />

          {/* 🟢 FIXED: Removed 'bg-base-50' & 'focus:bg-white', used theme-safe colors */}
          <input
            className="input input-sm w-full pl-9 bg-base-200 focus:bg-base-100 focus:border-primary transition-all border-transparent text-base-content placeholder:text-base-content/40"
            placeholder="Search tours, clients, or destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Status Filter */}
          <div className="join">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`btn btn-sm join-item ${statusFilter === "ALL" ? "btn-active btn-neutral" : "btn-ghost bg-base-200/50 hover:bg-base-200"}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`btn btn-sm join-item ${statusFilter === "ACTIVE" ? "btn-active btn-primary" : "btn-ghost bg-base-200/50 hover:bg-base-200"}`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("DRAFT")}
              className={`btn btn-sm join-item ${statusFilter === "DRAFT" ? "btn-active btn-warning text-white" : "btn-ghost bg-base-200/50 hover:bg-base-200"}`}
            >
              Drafts
            </button>
          </div>

          <div className="w-px h-8 bg-base-300 hidden md:block"></div>

          {/* Sort Dropdown - Fixed Dark Mode */}
          <select
            className="select select-sm bg-base-200 focus:bg-base-100 border-transparent focus:border-primary text-base-content"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="UPDATED_DESC">Last Updated</option>
            <option value="DATE_ASC">Departure (Earliest)</option>
            <option value="DATE_DESC">Departure (Latest)</option>
            <option value="NAME_ASC">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* MAIN TABLE CARD */}
      <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            {/* Table Head */}
            <thead>
              <tr className="bg-base-200/50 border-b border-base-200 text-xs uppercase font-bold text-base-content/50">
                <th className="py-4 pl-6">Tour Details</th>
                <th>Client</th>
                <th>Dates & Duration</th>
                <th className="w-1/4">Creation Progress</th>
                <th>Status</th>
                <th className="pr-6 text-right">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="text-sm">
              {processedTours.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-base-content/40"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                        <Filter size={32} className="opacity-20" />
                      </div>
                      <p>No tours match your filters.</p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                        }}
                        className="btn btn-link btn-sm text-primary"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedTours.map((tour) => {
                  const progress = getTourProgress(tour);

                  return (
                    <tr
                      key={tour.id}
                      className="group hover:bg-base-200/50 transition-colors border-b border-base-100 last:border-none"
                    >
                      {/* 1. Tour Name */}
                      <td className="pl-6 py-4">
                        <div className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                          {tour.name}
                        </div>
                        <div className="text-xs text-base-content/50 flex items-center gap-1.5 mt-1">
                          <MapPin size={12} /> {tour.startLocation} →{" "}
                          {tour.destination}
                        </div>
                      </td>

                      {/* 2. Client */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="w-9 h-9 rounded-full bg-base-200 text-base-content/60 ring-1 ring-base-200">
                              {tour.client?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={tour.client.image}
                                  alt={tour.client.name || "Client"}
                                />
                              ) : (
                                <span className="text-xs font-bold">
                                  {tour.client?.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-xs text-base-content/80">
                              {tour.client?.name || "Unknown"}
                            </div>
                            <div className="text-[10px] opacity-50">
                              {tour.participantSummary?.totalPax || 0} Pax
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Dates */}
                      <td>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-base-content/80">
                            <Calendar size={12} className="opacity-50" />
                            {new Date(tour.startDate).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] opacity-60 bg-base-200 w-fit px-1.5 py-0.5 rounded-md">
                            <Clock size={10} /> {tour.duration} Days
                          </div>
                        </div>
                      </td>

                      {/* 4. Progress Bar */}
                      <td>
                        {tour.status === "DRAFT" ? (
                          <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
                              <span className={`text-${progress.color}`}>
                                {progress.step}
                              </span>
                              <span className="opacity-40">
                                {progress.percent}%
                              </span>
                            </div>
                            <progress
                              className={`progress w-full h-1.5 bg-base-200 progress-${progress.color}`}
                              value={progress.percent}
                              max="100"
                            ></progress>
                            <div className="text-[10px] text-base-content/40 truncate">
                              Next: {progress.label}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-success text-xs font-bold bg-success/5 px-3 py-1.5 rounded-lg w-fit border border-success/10">
                            <CheckCircle2 size={14} /> Ready
                          </div>
                        )}
                      </td>

                      {/* 5. Status Badge */}
                      <td>
                        <div
                          className={`badge badge-sm font-bold border-none py-2.5 ${
                            tour.status === "DRAFT"
                              ? "bg-base-200 text-base-content/60"
                              : tour.status === "CONFIRMED"
                                ? "bg-success/10 text-success"
                                : tour.status === "PAYMENT_PENDING"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-primary/10 text-primary"
                          }`}
                        >
                          {tour.status.replace("_", " ")}
                        </div>
                      </td>

                      {/* 6. Actions */}
                      <td className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tour.status === "DRAFT" ? (
                            <Link
                              href={progress.nextUrl}
                              className="btn btn-xs btn-primary btn-outline gap-1"
                            >
                              Resume <ArrowRight size={12} />
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/tours/${tour.id}`}
                              className="btn btn-xs btn-ghost gap-1"
                            >
                              View <ArrowRight size={12} />
                            </Link>
                          )}

                          <div className="dropdown dropdown-end">
                            <div
                              tabIndex={0}
                              role="button"
                              className="btn btn-square btn-ghost btn-xs text-base-content/40"
                            >
                              <MoreHorizontal size={16} />
                            </div>
                            <ul
                              tabIndex={0}
                              className="dropdown-content z-1 menu p-2 shadow-xl bg-base-100 rounded-xl w-48 border border-base-200 mt-2"
                            >
                              <li>
                                <Link href={`/dashboard/tours/${tour.id}`}>
                                  Overview
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href={`/dashboard/tours/${tour.id}/itinerary`}
                                >
                                  Edit Itinerary
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href={`/dashboard/tours/${tour.id}/financials`}
                                >
                                  Financials
                                </Link>
                              </li>
                              <li className="text-error">
                                <button>Delete Tour</button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
