import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { NewTourWizard } from "@/components/tours/NewTourWizard";

export default async function NewTourPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [locations, clients] = await Promise.all([
    prisma.location.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true }
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    })
  ]);

  return (
    <div className="w-full max-w-3xl mx-auto py-12">
      <NewTourWizard locations={locations} clients={clients} />
    </div>
  );
}