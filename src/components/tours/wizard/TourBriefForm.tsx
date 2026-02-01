"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Wallet,
  User,
  Clock,
  ArrowRight,
  Search,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { createTourBrief } from "@/actions/tour-wizard";
import { toast } from "sonner";

interface Props {
  clients: any[];
}

export function TourBriefForm({ clients }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- PAX STATES ---
  // We now maintain totalPax separately so it can be edited directly
  const [totalPax, setTotalPax] = useState<number | string>(2);
  const [boys, setBoys] = useState<number | string>("");
  const [girls, setGirls] = useState<number | string>("");

  const [budget, setBudget] = useState(10000);

  // --- CLIENT SEARCH STATES ---
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-calculate Total if Boys/Girls are typed
  useEffect(() => {
    const b = typeof boys === "number" ? boys : 0;
    const g = typeof girls === "number" ? girls : 0;
    if (b > 0 || g > 0) {
      setTotalPax(b + g);
    }
  }, [boys, girls]);

  // Close dropdown logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsClientOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 5);
    return clients
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.email?.toLowerCase().includes(clientSearch.toLowerCase()),
      )
      .slice(0, 10);
  }, [clients, clientSearch]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.error("Please select a client first.");
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await createTourBrief(formData);

    if (res.success) {
      toast.success("Brief created! Moving to route planner...");
      router.push(`/dashboard/tours/${res.tourId}/wizard/destinations`);
    } else {
      toast.error(res.error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-8">
      {/* SECTION 1: IDENTITY */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-2">
          <User size={16} /> Who & What
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label text-xs font-bold uppercase">
              Tour Name
            </label>
            <input
              name="name"
              className="input input-bordered w-full"
              placeholder="e.g. Class 10 Educational Tour"
              required
            />
          </div>

          <div className="form-control relative" ref={dropdownRef}>
            <label className="label text-xs font-bold uppercase">
              Select Client
            </label>
            <input
              type="hidden"
              name="clientId"
              value={selectedClient?.id || ""}
              required
            />

            <div
              className={`input input-bordered w-full flex items-center justify-between cursor-pointer ${!selectedClient ? "text-base-content/50" : "text-base-content"}`}
              onClick={() => setIsClientOpen(!isClientOpen)}
            >
              {selectedClient ? (
                <span className="flex items-center gap-2 font-medium">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden shrink-0">
                    {selectedClient.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedClient.image}
                        alt={selectedClient.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedClient.name?.charAt(0)
                    )}
                  </div>
                  {selectedClient.name}
                </span>
              ) : (
                "Search client..."
              )}
              <ChevronsUpDown size={16} className="opacity-50" />
            </div>

            {isClientOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-base-100 border border-base-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 border-b border-base-200">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                    />
                    <input
                      autoFocus
                      className="input input-sm w-full pl-9 bg-base-200 text-base-content placeholder:text-base-content/40 focus:outline-none focus:bg-base-200/50"
                      placeholder="Type to filter..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setIsClientOpen(false);
                        setClientSearch("");
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center font-bold text-xs text-base-content/60 group-hover:bg-base-100 group-hover:text-primary overflow-hidden shrink-0">
                        {client.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={client.image}
                            alt={client.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          client.name?.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-none truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-base-content/50 mt-1 truncate">
                          {client.email}
                        </p>
                      </div>
                      {selectedClient?.id === client.id && (
                        <Check size={16} className="text-primary shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="divider"></div>

      {/* SECTION 2: LOGISTICS */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-2">
          <Clock size={16} /> When & How Long
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label text-xs font-bold uppercase">
              Start Date
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              />
              <input
                type="date"
                name="startDate"
                className="input input-bordered w-full pl-10"
                required
              />
            </div>
          </div>
          <div className="form-control">
            <label className="label text-xs font-bold uppercase">
              Duration (Days)
            </label>
            <input
              type="number"
              name="duration"
              defaultValue={5}
              min={1}
              className="input input-bordered w-full"
              required
            />
          </div>
        </div>
      </div>

      <div className="divider"></div>

      {/* SECTION 3: PAX & BUDGET (UPDATED) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-2">
          <Users size={16} /> Students & Budget
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 🟢 TOTAL PAX: Now Editable */}
          <div className="form-control">
            <label className="label text-xs font-bold uppercase text-primary">
              Total Pax *
            </label>
            <input
              type="number"
              name="totalPax"
              value={totalPax}
              onChange={(e) => setTotalPax(parseInt(e.target.value) || "")}
              min={1}
              className="input input-bordered w-full font-bold text-lg"
              required
            />
          </div>
          {/* 🟢 BOYS: Optional */}
          <div className="form-control">
            <label className="label text-xs font-bold uppercase">
              Boys{" "}
              <span className="opacity-50 font-normal normal-case">
                (Optional)
              </span>
            </label>
            <input
              type="number"
              name="boys"
              value={boys}
              onChange={(e) =>
                setBoys(e.target.value === "" ? "" : parseInt(e.target.value))
              }
              className="input input-bordered w-full"
              placeholder="--"
            />
          </div>
          {/* 🟢 GIRLS: Optional */}
          <div className="form-control">
            <label className="label text-xs font-bold uppercase">
              Girls{" "}
              <span className="opacity-50 font-normal normal-case">
                (Optional)
              </span>
            </label>
            <input
              type="number"
              name="girls"
              value={girls}
              onChange={(e) =>
                setGirls(e.target.value === "" ? "" : parseInt(e.target.value))
              }
              className="input input-bordered w-full"
              placeholder="--"
            />
          </div>
        </div>

        <div className="bg-base-50 p-6 rounded-xl border border-base-200 mt-4">
          <div className="flex items-center gap-4">
            <div className="form-control flex-1">
              <label className="label text-xs font-bold uppercase">
                Target Budget (Per Student)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 font-bold">
                  NPR
                </span>
                <input
                  type="number"
                  name="budgetPerPax"
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  className="input input-bordered w-full pl-12"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-base-content/50 font-bold mb-1">
                Estimated Total Budget
              </div>
              <div className="text-3xl font-black text-primary">
                {((Number(totalPax) || 0) * budget).toLocaleString()}{" "}
                <span className="text-sm font-medium text-base-content/40">
                  NPR
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-base-content/50 flex gap-2 items-center">
            <Wallet size={12} /> The AI will use this to suggest Hotels &
            Transport.
          </div>
        </div>
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary px-8 gap-2 rounded-xl shadow-lg shadow-primary/20"
        >
          {isSubmitting ? "Initializing..." : "Next: Choose Route"}{" "}
          <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}
