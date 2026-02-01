"use client";

import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Save,
  Loader2,
  Camera,
  Palette,
  Check,
} from "lucide-react";
import { updateProfile } from "@/actions/settings";
import { toast } from "sonner";
import Image from "next/image";

interface Props {
  user: any;
}

// List of standard DaisyUI themes
const THEMES = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
];

export function SettingsForm({ user }: Props) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<
    "GENERAL" | "APPEARANCE" | "SECURITY"
  >("GENERAL");
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [currentTheme, setCurrentTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // --- EFFECTS ---
  // 1. Initialize Theme from LocalStorage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") || "light";
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // --- HANDLERS ---

  // 1. Handle Theme Change
  const handleThemeChange = (newTheme: string) => {
    setCurrentTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    toast.success(`Theme set to ${newTheme}`);
  };

  // 2. Handle Profile Update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", name);

    const res = await updateProfile(formData);

    if (res.success) {
      toast.success("Profile updated successfully");
    } else {
      toast.error(res.error || "Failed to update profile");
    }

    setIsLoading(false);
  };

  // Prevent hydration mismatch for theme rendering
  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* LEFT: SIDEBAR NAVIGATION */}
      <div className="col-span-1 space-y-1">
        <button
          onClick={() => setActiveTab("GENERAL")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            activeTab === "GENERAL"
              ? "bg-primary text-primary-content shadow-md"
              : "hover:bg-base-200 text-base-content/70"
          }`}
        >
          <User size={18} /> General Profile
        </button>

        <button
          onClick={() => setActiveTab("APPEARANCE")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            activeTab === "APPEARANCE"
              ? "bg-primary text-primary-content shadow-md"
              : "hover:bg-base-200 text-base-content/70"
          }`}
        >
          <Palette size={18} /> Appearance
        </button>

        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            activeTab === "SECURITY"
              ? "bg-primary text-primary-content shadow-md"
              : "hover:bg-base-200 text-base-content/70"
          }`}
        >
          <Lock size={18} /> Security
        </button>
      </div>

      {/* RIGHT: CONTENT AREA */}
      <div className="col-span-1 md:col-span-3">
        {/* --- GENERAL TAB --- */}
        {activeTab === "GENERAL" && (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200">
              <h2 className="font-bold text-lg">Personal Information</h2>
              <p className="text-xs text-base-content/60">
                Update your photo and personal details here.
              </p>
            </div>

            <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer">
                  <div className="avatar">
                    <div className="w-24 rounded-full ring ring-base-200 ring-offset-base-100 ring-offset-2 overflow-hidden">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={name}
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      ) : (
                        <div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center text-3xl font-bold">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Profile Picture</h3>
                  <p className="text-xs text-base-content/50 mb-3">
                    Supports JPG, PNG or GIF. Max 5MB.
                  </p>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    disabled
                  >
                    Upload New (Coming Soon)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="input input-bordered w-full bg-base-200 cursor-not-allowed opacity-70"
                  />
                  <label className="label">
                    <span className="label-text-alt text-warning">
                      Email cannot be changed
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-base-200">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary gap-2 min-w-[140px]"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- APPEARANCE TAB --- */}
        {activeTab === "APPEARANCE" && (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200">
              <h2 className="font-bold text-lg">Interface Theme</h2>
              <p className="text-xs text-base-content/60">
                Choose a theme that matches your style.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {THEMES.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`
                                relative border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left
                                ${currentTheme === theme ? "ring-2 ring-primary ring-offset-2" : "border-base-200 opacity-80 hover:opacity-100"}
                            `}
                  >
                    {/* Theme Preview Box */}
                    <div
                      data-theme={theme}
                      className="bg-base-100 text-base-content w-full h-full cursor-pointer p-3 min-h-[80px] flex flex-col justify-between"
                    >
                      <div className="font-bold text-xs capitalize truncate">
                        {theme}
                      </div>
                      <div className="flex gap-1.5">
                        <div className="bg-primary w-2 h-2 rounded-full"></div>
                        <div className="bg-secondary w-2 h-2 rounded-full"></div>
                        <div className="bg-accent w-2 h-2 rounded-full"></div>
                        <div className="bg-neutral w-2 h-2 rounded-full"></div>
                      </div>
                    </div>

                    {/* Active Checkmark */}
                    {currentTheme === theme && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-content rounded-full p-0.5 shadow-sm">
                        <Check size={10} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === "SECURITY" && (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200">
              <h2 className="font-bold text-lg">Security Settings</h2>
              <p className="text-xs text-base-content/60">
                Manage your password and account access.
              </p>
            </div>
            <div className="p-6">
              <div className="alert bg-base-200/50 border-none">
                <Lock size={20} className="text-primary" />
                <div className="text-sm">
                  <div className="font-bold">Password Management</div>
                  <div className="opacity-60">
                    To change your password, please use the "Forgot Password"
                    flow on the login page or check your email for a reset link.
                  </div>
                </div>
              </div>

              {/* Visual Placeholder (Disabled) */}
              <div className="mt-8 opacity-40 pointer-events-none grayscale select-none">
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-bold">
                      Current Password
                    </span>
                  </label>
                  <input
                    type="password"
                    value="********"
                    readOnly
                    className="input input-bordered"
                  />
                </div>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-bold">New Password</span>
                  </label>
                  <input
                    type="password"
                    value="********"
                    readOnly
                    className="input input-bordered"
                  />
                </div>
                <button className="btn btn-primary w-full sm:w-auto">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
