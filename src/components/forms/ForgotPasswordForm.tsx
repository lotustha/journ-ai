"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "@/actions/forgot-password";
import { Loader2, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const initialState = {
  message: "",
  success: false,
};

export function ForgotPasswordForm() {
  // @ts-ignore
  const [state, action, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  if (state?.success) {
    return (
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold">Check your email</h3>
        <p className="text-base-content/60">
          We have sent a password reset link to your email address.
        </p>
        <div className="alert alert-info text-xs text-left mt-4">
          Developer Note: Check your VS Code terminal for the link.
        </div>
        <Link href="/login" className="btn btn-ghost w-full">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
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
            className="input input-bordered w-full pl-10 focus:input-primary bg-base-100"
            required
          />
        </div>
      </div>

      {state?.message && !state.success && (
        <div className="alert alert-error text-sm py-2">
          <span>{state.message}</span>
        </div>
      )}

      <button
        className="btn btn-primary w-full shadow-lg shadow-primary/20"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Link...
          </>
        ) : (
          <>
            Send Reset Link <ArrowRight size={18} className="ml-1" />
          </>
        )}
      </button>

      <div className="text-center">
        <Link
          href="/login"
          className="link link-hover text-sm text-base-content/60"
        >
          Back to Login
        </Link>
      </div>
    </form>
  );
}
