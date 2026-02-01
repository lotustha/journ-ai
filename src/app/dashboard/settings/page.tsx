import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || !session.user?.email) redirect("/login");

  // Fetch fresh user data
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
        <p className="text-base-content/60">
          Manage your account preferences and profile.
        </p>
      </div>

      <SettingsForm user={user} />
    </div>
  );
}
