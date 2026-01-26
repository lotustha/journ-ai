"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

const initialState = {
  message: "",
};

export function LoginForm() {
  // @ts-ignore - React 19/Next 16 type compatibility
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-6">
      {/* Email Input */}
      <div className="form-control space-y-2">
        <label className="label-text font-medium text-base-content/70">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
            <Mail size={18} />
          </div>
          <input
            name="email"
            type="email"
            placeholder="admin@tour-app.com"
            className="input input-bordered w-full pl-10 focus:input-primary transition-all bg-base-100"
            required
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="form-control space-y-2">
        <div className="flex justify-between items-center">
          <label className="label-text font-medium text-base-content/70">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium link link-primary no-underline hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
            <Lock size={18} />
          </div>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            className="input input-bordered w-full pl-10 focus:input-primary transition-all bg-base-100"
            required
          />
        </div>
      </div>

      {/* Error Message */}
      {state?.message && (
        <div
          role="alert"
          className="alert alert-error text-sm py-2 rounded-lg flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{state.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn btn-primary w-full shadow-lg shadow-primary/20"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            Sign In <ArrowRight size={18} className="ml-1" />
          </>
        )}
      </button>

      {/* Footer Text */}
      <div className="text-center text-sm text-base-content/60">
        Don't have an account?{" "}
        <span className="text-base-content/40 cursor-not-allowed">
          Contact Admin
        </span>
      </div>
    </form>
  );
}
