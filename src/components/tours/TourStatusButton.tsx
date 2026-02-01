"use client";

import { useState } from "react";
import { updateTourStatus } from "@/actions/tour";
import { TourStatus } from "../../../generated/prisma/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  tourId: string;
  targetStatus: TourStatus;
  label?: string;
  className?: string;
}

export function TourStatusButton({
  tourId,
  targetStatus,
  label = "Confirm Tour",
  className,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const res = await updateTourStatus(tourId, targetStatus);
      if (res.success) {
        toast.success(`Tour marked as ${targetStatus.replace("_", " ")}`);
      } else {
        toast.error(res.error || "Action failed");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpdate}
      disabled={isLoading}
      className={className || "btn btn-sm btn-success text-white gap-2"}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <CheckCircle2 size={16} />
      )}
      {label}
    </button>
  );
}
