"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // 👈 1. Import Router
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Calculator,
  Save,
  PieChart,
  AlertCircle,
} from "lucide-react";
import { updateFinancials } from "@/actions/financials";
import { toast } from "sonner";

interface Props {
  tour: any;
  financials: any;
}

export function FinancialsManager({ tour, financials }: Props) {
  const router = useRouter(); // 👈 2. Initialize Router
  const [isSaving, setIsSaving] = useState(false);

  // --- 1. AGGREGATE COSTS ---
  const breakdown = tour.itinerary.reduce(
    (acc: any, day: any) => {
      day.items.forEach((item: any) => {
        const cost = Number(item.costPrice || 0);
        acc.totalCost += cost;
        if (!acc.byType[item.type]) acc.byType[item.type] = 0;
        acc.byType[item.type] += cost;
      });
      return acc;
    },
    { totalCost: 0, byType: {} },
  );

  // --- 2. STATE ---
  const [budget, setBudget] = useState(Number(financials?.budget || 0));
  const [marginPercent, setMarginPercent] = useState(
    Number(financials?.profitMargin || 15),
  );

  const totalBaseCost = breakdown.totalCost;
  const recommendedPrice =
    totalBaseCost + (totalBaseCost * marginPercent) / 100;

  const [finalSellingPrice, setFinalSellingPrice] = useState(
    Number(financials?.sellingPrice) > 0
      ? Number(financials?.sellingPrice)
      : recommendedPrice,
  );

  // Sync selling price with margin changes (optional UX)
  useEffect(() => {
    setFinalSellingPrice(totalBaseCost + (totalBaseCost * marginPercent) / 100);
  }, [marginPercent, totalBaseCost]);

  const netProfit = finalSellingPrice - totalBaseCost;
  const actualMargin =
    totalBaseCost > 0 ? (netProfit / totalBaseCost) * 100 : 0;
  const costPerPax =
    tour.participantSummary?.totalPax > 0
      ? finalSellingPrice / tour.participantSummary.totalPax
      : 0;

  // --- HANDLER ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("tourId", tour.id);
      formData.append("budget", budget.toString());
      formData.append("profitMargin", marginPercent.toString());
      formData.append("sellingPrice", finalSellingPrice.toString());

      const res = await updateFinancials(formData);

      if (res.success) {
        toast.success("Financials saved! Redirecting...");
        // 👈 3. Redirect back to Tour Overview
        router.push(`/dashboard/tours/${tour.id}`);
        router.refresh(); // Ensure the overview page shows updated status
      } else {
        toast.error(res.error || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: COST BREAKDOWN */}
      <div className="space-y-6">
        <div className="card bg-base-100 border border-base-200 shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <PieChart size={18} /> Cost Breakdown
          </h3>

          <div className="space-y-3">
            {Object.entries(breakdown.byType).map(
              ([type, cost]: [string, any]) => (
                <div
                  key={type}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="capitalize opacity-70">
                    {type.toLowerCase()}
                  </span>
                  <span className="font-mono font-bold">
                    NPR {cost.toLocaleString()}
                  </span>
                </div>
              ),
            )}
            <div className="divider my-2"></div>
            <div className="flex justify-between items-center text-lg font-black">
              <span>Total Base Cost</span>
              <span className="text-error">
                NPR {totalBaseCost.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] opacity-50 text-right mt-1">
              *Sum of all booked items
            </p>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-200 shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Wallet size={18} /> Client Budget
          </h3>
          <div className="form-control">
            <label className="label text-xs font-bold uppercase opacity-50">
              Max Budget (NPR)
            </label>
            <input
              type="number"
              className="input input-bordered font-mono"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </div>
          {finalSellingPrice > budget && budget > 0 && (
            <div className="alert alert-warning mt-4 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>
                Price exceeds client budget by NPR{" "}
                {(finalSellingPrice - budget).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE & RIGHT: CALCULATOR */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card bg-base-100 border border-base-200 shadow-sm p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black">Pricing Calculator</h2>
              <p className="opacity-60 text-sm">
                Set your margins to determine the final package price.
              </p>
            </div>
            <div className="badge badge-neutral p-3 font-mono">
              {tour.participantSummary?.totalPax || 0} PAX
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* INPUTS */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm">Profit Margin</span>
                  <span className="font-mono text-primary font-bold">
                    {marginPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(Number(e.target.value))}
                  className="range range-primary range-sm"
                />
                <div className="flex justify-between text-[10px] opacity-40 mt-1 font-mono">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="p-4 bg-base-50 rounded-xl border border-base-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase opacity-50">
                    Net Profit
                  </span>
                  <span className="text-success font-black font-mono text-lg">
                    + NPR{" "}
                    {netProfit.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase opacity-50">
                    Actual Margin
                  </span>
                  <span
                    className={`text-xs font-bold ${actualMargin < 10 ? "text-warning" : "text-success"}`}
                  >
                    {actualMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="text-right space-y-2">
              <div className="text-sm font-bold opacity-50 uppercase">
                Final Selling Price
              </div>
              <div className="text-4xl md:text-5xl font-black text-primary tracking-tight">
                <span className="text-lg text-base-content/30 mr-2">NPR</span>
                {finalSellingPrice.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="text-sm opacity-60 font-mono">
                ~ NPR{" "}
                {costPerPax.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                per person
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="divider"></div>
          <div className="flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary px-8 gap-2 rounded-xl shadow-lg shadow-primary/20"
            >
              {isSaving ? "Saving..." : "Save & Finish"} <Save size={18} />
            </button>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-emerald-50 border border-emerald-100 p-4">
            <div className="flex gap-3 items-center text-emerald-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <TrendingUp size={20} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold opacity-60">
                  Profitability
                </div>
                <div className="font-black text-lg">High</div>
              </div>
            </div>
          </div>
          <div className="card bg-blue-50 border border-blue-100 p-4">
            <div className="flex gap-3 items-center text-blue-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Calculator size={20} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold opacity-60">
                  Items Costed
                </div>
                <div className="font-black text-lg">100%</div>
              </div>
            </div>
          </div>
          <div className="card bg-purple-50 border border-purple-100 p-4">
            <div className="flex gap-3 items-center text-purple-700">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <DollarSign size={20} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold opacity-60">
                  Avg Daily Cost
                </div>
                <div className="font-black text-lg">
                  NPR{" "}
                  {(totalBaseCost / (tour.duration || 1)).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 },
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
