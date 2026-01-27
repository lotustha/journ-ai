'use server'

import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { saveDocumentLocally, saveImageLocally } from "./resources"

// Helper to safely parse dates
const safeDate = (dateStr: FormDataEntryValue | null) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === "") return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

// ==========================================
// 1. CREATE CLIENT
// ==========================================
export async function createClient(prevState: any, formData: FormData) {
    try {
        const imageUrl = await saveImageLocally(formData.get("image") as File);

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const nationality = formData.get('nationality') as string
        const address = formData.get('address') as string
        const gender = formData.get('gender') as string
        const passportNumber = formData.get('passportNumber') as string
        const dietaryInfo = formData.get('dietaryInfo') as string
        const medicalInfo = formData.get('medicalInfo') as string
        const emergencyName = formData.get('emergencyContactName') as string
        const emergencyPhone = formData.get('emergencyContactPhone') as string
        const notes = formData.get('notes') as string

        const dobRaw = formData.get('dateOfBirth') as string
        const passportExpRaw = formData.get('passportExpiry') as string

        if (!email) return { error: "Email is required" };

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return { error: `The email ${email} is already registered.` }
        }

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    image: imageUrl,
                    role: 'CLIENT',
                }
            })

            await tx.clientProfile.create({
                data: {
                    userId: user.id,
                    phone: phone || null,
                    nationality: nationality || null,
                    address: address || null,
                    gender: gender || null,
                    passportNumber: passportNumber || null,
                    dietaryInfo: dietaryInfo || null,
                    medicalInfo: medicalInfo || null,
                    emergencyContactName: emergencyName || null,
                    emergencyContactPhone: emergencyPhone || null,
                    notes: notes || null,
                    dateOfBirth: safeDate(dobRaw),
                    passportExpiry: safeDate(passportExpRaw),
                }
            })
        })

        revalidatePath('/dashboard/users')
        return { success: true, message: "Client profile created successfully" }

    } catch (e: any) {
        console.error("Create Client Error:", e)
        // 👈 FIX: Return the actual error message
        return { error: e.message || "Failed to create client." }
    }
}

// ==========================================
// 2. UPDATE CLIENT
// ==========================================
export async function updateClient(prevState: any, formData: FormData) {
    try {
        const id = formData.get('id') as string
        const newImageUrl = await saveImageLocally(formData.get("image") as File);

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const nationality = formData.get('nationality') as string
        const address = formData.get('address') as string
        const gender = formData.get('gender') as string
        const passportNumber = formData.get('passportNumber') as string
        const dietaryInfo = formData.get('dietaryInfo') as string
        const medicalInfo = formData.get('medicalInfo') as string
        const emergencyName = formData.get('emergencyContactName') as string
        const emergencyPhone = formData.get('emergencyContactPhone') as string
        const notes = formData.get('notes') as string
        const dobRaw = formData.get('dateOfBirth') as string
        const passportExpRaw = formData.get('passportExpiry') as string

        if (!id || !email) return { error: "Missing required fields" };

        await prisma.$transaction(async (tx) => {
            const userUpdateData: any = { name, email };
            if (newImageUrl) userUpdateData.image = newImageUrl;

            await tx.user.update({
                where: { id },
                data: userUpdateData
            })

            await tx.clientProfile.upsert({
                where: { userId: id },
                create: {
                    userId: id,
                    phone, nationality, address, gender, passportNumber, dietaryInfo, medicalInfo, notes,
                    emergencyContactName: emergencyName,
                    emergencyContactPhone: emergencyPhone,
                    dateOfBirth: safeDate(dobRaw),
                    passportExpiry: safeDate(passportExpRaw),
                },
                update: {
                    phone, nationality, address, gender, passportNumber, dietaryInfo, medicalInfo, notes,
                    emergencyContactName: emergencyName,
                    emergencyContactPhone: emergencyPhone,
                    dateOfBirth: safeDate(dobRaw),
                    passportExpiry: safeDate(passportExpRaw),
                }
            })
        })

        revalidatePath('/dashboard/users')
        return { success: true, message: "Client updated successfully" }

    } catch (e: any) {
        console.error("Update Client Error:", e)
        // 👈 FIX: Return actual error
        return { error: e.message || "Failed to update client" }
    }
}

// ==========================================
// 3. DOCUMENT ACTIONS
// ==========================================
export async function uploadClientDocument(formData: FormData) {
    try {
        const clientId = formData.get("clientId") as string;
        const type = formData.get("type") as string;
        const file = formData.get("file") as File;

        if (!clientId) return { error: "Client ID missing" };

        const client = await prisma.user.findUnique({
            where: { id: clientId },
            include: { clientProfile: true }
        });

        if (!client?.clientProfile) return { error: "Client profile not found" };

        const url = await saveDocumentLocally(file);

        if (!url) {
            return { error: "Invalid file type or upload failed. Only PDF/Images allowed." };
        }

        await prisma.clientDocument.create({
            data: {
                clientProfileId: client.clientProfile.id,
                name: file.name,
                type,
                url
            }
        });

        revalidatePath("/dashboard/users");
        return { success: true, message: "Document uploaded" };
    } catch (e: any) {
        console.error(e);
        // 👈 FIX: Return actual error
        return { error: e.message || "Upload failed" };
    }
}

export async function deleteClientDocument(id: string) {
    try {
        await prisma.clientDocument.delete({ where: { id } });
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Failed to delete document" };
    }
}

export async function deleteClient(id: string) {
    try {
        await prisma.user.delete({ where: { id } })
        revalidatePath('/dashboard/users')
        return { success: true }
    } catch (e: any) {
        return { error: "Failed to delete. Client might be linked to active tours." }
    }
}