import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { ClientManager } from "@/components/users/ClientManager";

export default async function UsersPage() {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
        redirect("/login");
    }

    // Fetch only Clients (not admins/staff)
    const clients = await prisma.user.findMany({
        where: { role: "CLIENT" },
        orderBy: { createdAt: "desc" },
        include: {
            clientProfile: true
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Client Database</h1>
                <p className="text-base-content/60">Manage customer profiles, documents, and travel history.</p>
            </div>
            <ClientManager initialData={clients} />
        </div>
    );
}