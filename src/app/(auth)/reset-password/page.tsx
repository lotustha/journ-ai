import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

// This is a Server Component, so we can access DB directly to pre-validate token
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams; // In Next.js 15+, searchParams is a Promise

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="alert alert-error max-w-md">
          <span>
            Error: Missing reset token. Please use the link from your email.
          </span>
        </div>
      </div>
    );
  }

  // Optional: Pre-validate token on server load for better UX
  const validToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  const isExpired = validToken ? new Date() > validToken.expires : true;

  if (!validToken || isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="text-2xl font-bold text-error">Link Expired</h2>
            <p className="py-4">
              This password reset link is invalid or has expired.
            </p>
            <a href="/forgot-password" className="btn btn-primary">
              Request New Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-2xl bg-base-100">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center mb-6">
            Set New Password
          </h2>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
