import { RegisterForm } from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-100">
      {/* LEFT: Visuals (Gradient Variant) */}
      <div className="hidden lg:relative lg:flex flex-col justify-between p-12 overflow-hidden bg-neutral text-neutral-content">
        {/* Gradient Background - Slightly more vibrant for 'New Beginning' */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-900 via-slate-900 to-slate-900">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-secondary/30 blur-3xl" />
            <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-3xl" />
          </div>
        </div>

        {/* Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white shadow-lg backdrop-blur-sm">
              J
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              JournAI
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-4">
            Start your journey.
          </h2>
          <p className="text-lg text-neutral-content/80 leading-relaxed">
            Join the platform that is redefining how travel experiences are
            designed, managed, and delivered.
          </p>
        </div>

        <div className="relative z-10 text-xs text-neutral-content/40">
          © {new Date().getFullYear()} JournAI Inc.
        </div>
      </div>

      {/* RIGHT: Register Form */}
      <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-base-100">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-content">
              J
            </div>
            <span className="text-xl font-bold tracking-tight">JournAI</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-base-content">
              Create an account
            </h1>
            <p className="text-base-content/60">
              Enter your details to get started.
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
