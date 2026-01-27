'use server'

import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { TourStatus } from "../../generated/prisma/client"

// ==========================================
// 1. CREATE TOUR (The "Factory")
// ==========================================
export async function createTour(prevState: any, formData: FormData) {
    try {
        const name = formData.get('name') as string
        const startLocation = formData.get('startLocation') as string
        const destination = formData.get('destination') as string
        const startDateRaw = formData.get('startDate') as string
        const endDateRaw = formData.get('endDate') as string
        const clientId = formData.get('clientId') as string

        // Calculate Duration
        const start = new Date(startDateRaw)
        const end = new Date(endDateRaw)
        // Calculate difference in days (add 1 to include both start and end dates)
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

        if (duration < 1) {
            return { error: "End date must be after start date" }
        }

        // 1. Create the Tour Record
        const newTour = await prisma.tour.create({
            data: {
                name,
                startLocation,
                destination,
                startDate: start,
                endDate: end,
                duration,
                clientId: clientId || null, // Optional Client
                status: 'DRAFT'
            }
        })

        // 2. Auto-Generate Empty Itinerary Days
        // We create empty slots for every day of the trip immediately
        const daysData = Array.from({ length: duration }).map((_, i) => ({
            dayNumber: i + 1,
            tourId: newTour.id,
            title: `Day ${i + 1}: Exploration`,
            description: "Itinerary details to be added."
        }))

        await prisma.itineraryDay.createMany({
            data: daysData
        })

        // 3. Initialize Financial Record
        // FIXED: Using fields matching your provided Prisma Payload
        await prisma.tourFinancials.create({
            data: {
                tourId: newTour.id,
                budget: 0,
                profitMargin: 0,
                sellingPrice: 0,
                totalCollected: 0
            }
        })

        return { success: true, tourId: newTour.id }

    } catch (e) {
        console.error("Create Tour Error:", e)
        return { error: "Failed to create tour package. Check inputs." }
    }
}

// ==========================================
// 2. UPDATE TOUR (Settings & Status)
// ==========================================
export async function updateTour(prevState: any, formData: FormData) {
    try {
        const id = formData.get('id') as string
        const name = formData.get('name') as string
        const status = formData.get('status') as TourStatus

        await prisma.tour.update({
            where: { id },
            data: {
                name,
                status
            }
        })

        revalidatePath(`/dashboard/tours/${id}`)
        revalidatePath('/dashboard/tours')
        return { success: true, message: "Tour updated successfully" }
    } catch (e) {
        return { error: "Failed to update tour" }
    }
}

// ==========================================
// 3. DELETE TOUR
// ==========================================
export async function deleteTour(id: string) {
    try {
        // Note: Ensure your schema has onDelete: Cascade for relations 
        // (ItineraryDays, Financials, etc.) or this will fail.
        await prisma.tour.delete({ where: { id } })

        revalidatePath('/dashboard/tours')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Failed to delete tour. Check linked records." }
    }
}