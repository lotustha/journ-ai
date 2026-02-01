import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";

interface TourLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tourId: string }>; // 👈 1. Change type to Promise
}

export default async function TourLayout({
  children,
  params,
}: TourLayoutProps) {
  const session = await auth();
  if (!session) redirect("/login");

  // 👈 2. Await the params
  const { tourId } = await params;

  // Fetch minimal tour info for the header
  const tour = await prisma.tour.findUnique({
    where: { id: tourId }, // Now tourId is a string, not undefined
    select: { id: true, name: true, status: true, duration: true },
  });

  if (!tour) return notFound();

  return <main className="flex-1 bg-base-50/50">{children}</main>;
}
