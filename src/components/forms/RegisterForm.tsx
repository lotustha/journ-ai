"use client";

import { useActionState } from "react";
import { registerAction } from "@/actions/register";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface RegisterState {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success?: boolean;
}

const initialState: RegisterState = {
  message: "",
  errors: {},
  success: false,
};

export function RegisterForm() {
  const [state, action, isPending] = useActionState(
    registerAction,
    initialState,
  );

  // If registration is successful, show a success card
  if (state?.success) {
    return (
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold">Account Created!</h3>
        <p className="text-base-content/60">
          Your account has been successfully set up. You can now log in to the
          portal.
        </p>
        <Link href="/login" className="btn btn-primary w-full">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {/* Name Field */}
      <div className="form-control space-y-2">
        <label className="label-text font-medium text-base-content/70">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
            <User size={18} />
          </div>
          <input
            name="name"
            type="text"
            placeholder="John Doe"
            className="input input-bordered w-full pl-10 focus:input-primary bg-base-100"
            required
          />
        </div>
        {state?.errors?.name && (
          <p className="text-error text-xs">{state.errors.name?.[0]}</p>
        )}
      </div>

      {/* Email Field */}
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
            placeholder="john@example.com"
            className="input input-bordered w-full pl-10 focus:input-primary bg-base-100"
            required
          />
        </div>
        {state?.errors?.email && (
          <p className="text-error text-xs">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="form-control space-y-2">
        <label className="label-text font-medium text-base-content/70">
          Password
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
          />
        </div>
        {state?.errors?.password && (
          <p className="text-error text-xs">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Confirm Password Field */}
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
        {state?.errors?.confirmPassword && (
          <p className="text-error text-xs">
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>

      {/* General Error Message */}
      {state?.message && !state.success && (
        <div role="alert" className="alert alert-error text-sm py-2 rounded-lg">
          <span>{state.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn btn-primary w-full shadow-lg shadow-primary/20 mt-2"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            Create Account <ArrowRight size={18} className="ml-1" />
          </>
        )}
      </button>

      {/* Footer Text */}
      <div className="text-center text-sm text-base-content/60">
        Already have an account?{" "}
        <Link
          href="/login"
          className="link link-primary no-underline hover:underline font-medium"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
