import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { TourBriefForm } from "@/components/tours/wizard/TourBriefForm";

export default async function NewTourPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch Clients for the dropdown
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-base-100 flex justify-center py-12 px-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight">
            Plan a New Adventure
          </h1>
          <p className="text-base-content/60">
            Step 1: Define the trip constraints and budget.
          </p>
        </div>

        {/* The Form Component */}
        <div className="card bg-base-100 border border-base-200 shadow-xl overflow-hidden">
          <TourBriefForm clients={clients} />
        </div>
      </div>
    </div>
  );
}
