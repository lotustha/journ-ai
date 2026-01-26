"use client";

import { useActionState, useEffect } from "react";
import { resetPasswordAction } from "@/actions/reset-password";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner"; // 👈 Sonner Toast
import { useRouter } from "next/navigation";

const initialState = {
  message: "",
  success: false,
  error: "",
};

export function ResetPasswordForm({ token }: { token: string }) {
  // @ts-ignore
  const [state, action, isPending] = useActionState(
    resetPasswordAction,
    initialState,
  );
  const router = useRouter();

  // Use Effect to trigger Toasts based on server response
  useEffect(() => {
    if (state?.success) {
      setTimeout(() => router.push("/login"), 2000);
      toast.success(state.message || "Password updated successfully!");
      // Redirect to login after short delay
    } else if (state?.error) {
      toast.error(state.error);
    } else if (state?.message) {
      // General message fallback
      toast.info(state.message);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="form-control space-y-2">
        <label className="label-text font-medium text-base-content/70">
          New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
            <Lock size={18} />
          </div>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            className="input input-bordered w-full pl-10 focus:input-primary bg-base-100"
            required
            minLength={6}
          />
        </div>
      </div>

      <div className="form-control space-y-2">
        <label className="label-text font-medium text-base-content/70">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
            <Lock size={18} />
          </div>
          <input
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            className="input input-bordered w-full pl-10 focus:input-primary bg-base-100"
            required
          />
        </div>
      </div>

      <button
        className="btn btn-primary w-full shadow-lg mt-4"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            Update Password <ArrowRight size={18} className="ml-1" />
          </>
        )}
      </button>
    </form>
  );
}
