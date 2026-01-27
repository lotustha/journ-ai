import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { NewTourWizard } from "@/components/tours/NewTourWizard";

export default async function NewTourPage() {
    const session = await auth();
    if (!session) redirect("/login");

    // Fetch Data for Dropdowns
    const [locations, clients] = await Promise.all([
        prisma.location.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, type: true }
        }),
        prisma.user.findMany({
            where: { role: "CLIENT" },
            orderBy: { name: "asc" },
            select: { id: true, name: true, email: true } // Removed 'image' to fix previous error
        })
    ]);

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-black tracking-tight mb-2">Create New Tour</h1>
                <p className="text-base-content/60">
                    Let's set up the foundation for your new itinerary.
                </p>
            </div>

            <NewTourWizard locations={locations} clients={clients} />
        </div>
    );
}