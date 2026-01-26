import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-100">
      {/* LEFT: Branding & Visuals (Gradient Only) */}
      <div className="hidden lg:relative lg:flex flex-col justify-between p-12 overflow-hidden bg-neutral text-neutral-content">
        {/* Modern Deep Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Abstract decorative blobs for depth */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-3xl" />
          </div>
        </div>

        {/* Content on top */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-content shadow-lg shadow-primary/20">
              J
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              JournAI
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <blockquote className="text-3xl font-medium leading-tight text-white/90">
            "Automate the journey. <br />
            <span className="text-primary">Perfect the experience.</span>"
          </blockquote>
          <p className="mt-6 text-neutral-content/60 font-mono text-sm border-l-2 border-primary/50 pl-4">
            The all-in-one operating system for modern travel agencies.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs text-neutral-content/40">
          <span>© {new Date().getFullYear()} JournAI Inc.</span>
          <span className="w-1 h-1 rounded-full bg-neutral-content/20"></span>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-base-100">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-content">
              J
            </div>
            <span className="text-xl font-bold tracking-tight">JournAI</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-base-content">
              Welcome back
            </h1>
            <p className="text-base-content/60">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
