'use client'

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createTour } from "@/actions/tours"
import { Calendar, MapPin, User, Loader2, Sparkles, ChevronRight, Check } from "lucide-react"
import { toast } from "sonner"

interface NewTourWizardProps {
    locations: any[]
    clients: any[]
}

export function NewTourWizard({ locations, clients }: NewTourWizardProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        clientId: "",
        startDate: "",
        endDate: "",
        startLocation: "",
        destination: ""
    })

    // Calculations
    const duration = useMemo(() => {
        if (!formData.startDate || !formData.endDate) return 0
        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)
        const diffTime = end.getTime() - start.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return diffDays > 0 ? diffDays : 0
    }, [formData.startDate, formData.endDate])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit() {
        if (duration < 1) {
            toast.error("Invalid dates. End date must be after start date.")
            return
        }
        setIsSubmitting(true)
        const payload = new FormData()
        Object.entries(formData).forEach(([key, value]) => payload.append(key, value))

        const result = await createTour(null, payload)

        if (result?.success) {
            toast.success("Tour initialized successfully")
            router.push(`/dashboard/tours/${result.tourId}`)
        } else {
            toast.error(result?.error || "Failed to create tour")
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white border border-base-200 shadow-sm rounded-xl overflow-hidden max-w-2xl mx-auto">

            {/* 1. COMPACT HEADER */}
            <div className="bg-base-50/50 border-b border-base-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    New Tour
                </h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-base-content/40 uppercase tracking-widest">
                    <span className={step === 1 ? "text-primary" : ""}>Basics</span>
                    <span>/</span>
                    <span className={step === 2 ? "text-primary" : ""}>Logistics</span>
                </div>
            </div>

            {/* 2. PROGRESS LINE */}
            <div className="h-0.5 w-full bg-base-100">
                <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: step === 1 ? '50%' : '100%' }}
                />
            </div>

            <div className="p-6">
                {/* STEP 1: BASICS */}
                {step === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="form-control">
                            <label className="text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">
                                Tour Name
                            </label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. 7 Days Chitwan Jungle Safari"
                                className="input input-bordered w-full focus:outline-none focus:border-primary transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="form-control">
                            <label className="text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">
                                Client (Optional)
                            </label>
                            <div className="relative">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                                <select
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleChange}
                                    className="select select-bordered w-full pl-9 focus:outline-none focus:border-primary transition-all"
                                >
                                    <option value="">-- No Client Assigned --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: LOGISTICS */}
                {step === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">Start Date</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="input input-bordered w-full pl-9" />
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">End Date</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="input input-bordered w-full pl-9" />
                                </div>
                            </div>
                        </div>

                        {/* Compact Duration Indicator */}
                        <div className={`text-center py-1.5 rounded-md text-xs font-medium border ${duration > 0 ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-base-100 border-base-200 text-base-content/40'}`}>
                            {duration > 0 ? `${duration} Days / ${duration - 1} Nights` : 'Select dates to calculate duration'}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">Origin</label>
                                <div className="relative">
                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                                    <select name="startLocation" value={formData.startLocation} onChange={handleChange} className="select select-bordered w-full pl-9">
                                        <option value="">Select...</option>
                                        {locations.map(l => (<option key={l.id} value={l.name}>{l.name}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">Destination</label>
                                <div className="relative">
                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                                    <select name="destination" value={formData.destination} onChange={handleChange} className="select select-bordered w-full pl-9">
                                        <option value="">Select...</option>
                                        {locations.map(l => (<option key={l.id} value={l.name}>{l.name}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* COMPACT FOOTER */}
            <div className="px-6 py-4 bg-base-50/50 border-t border-base-200 flex justify-between items-center">
                {step > 1 ? (
                    <button onClick={() => setStep(s => s - 1)} className="btn btn-sm btn-ghost text-base-content/60 hover:bg-base-200" disabled={isSubmitting}>Back</button>
                ) : <div />}

                {step < 2 ? (
                    <button onClick={() => setStep(s => s + 1)} className="btn btn-sm btn-primary px-6" disabled={!formData.name}>
                        Next <ChevronRight size={14} />
                    </button>
                ) : (
                    <button onClick={handleSubmit} className="btn btn-sm btn-primary px-6 shadow-sm" disabled={isSubmitting || !formData.startDate || !formData.endDate}>
                        {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <><Check size={14} /> Create Tour</>}
                    </button>
                )}
            </div>
        </div>
    )
}