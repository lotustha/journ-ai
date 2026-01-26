'use client'

import { useState, useMemo } from "react"
import {
    Plus, Pencil, Trash2, Search, Car, User, Phone,
    Calendar, Gauge, Wallet, Save, X, Hash
} from "lucide-react"
import { createVehicle, updateVehicle, deleteResource } from "@/actions/resources"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"

const VEHICLE_TYPES = ["SUV (Scorpio/Jeep)", "Car (Sedan)", "Van (Hiace)", "Bus (Sutlej)", "Coaster", "4WD"]

export function VehicleManager({ initialData }: { initialData: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)

    // --- SEARCH & FILTER ---
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedType, setSelectedType] = useState("All")

    const filteredData = useMemo(() => {
        return initialData.filter(v => {
            const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.driverName?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesType = selectedType === "All" || v.type === selectedType
            return matchesSearch && matchesType
        })
    }, [initialData, searchQuery, selectedType])

    // --- HANDLERS ---
    function handleEdit(item: any) { setEditingItem(item); setIsModalOpen(true) }
    function handleCreate() { setEditingItem(null); setIsModalOpen(true) }

    async function handleDelete(id: string) {
        if (!confirm("Delete this vehicle?")) return
        const result = await deleteResource(id, 'vehicle')
        if (result?.success) toast.success("Vehicle deleted")
        else toast.error(result?.error)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        if (editingItem) formData.append('id', editingItem.id)

        const action = editingItem ? updateVehicle : createVehicle
        const result = await action(null, formData)

        if (result?.success) {
            toast.success(result.message)
            setIsModalOpen(false)
        } else {
            toast.error(result?.error || "Error saving vehicle")
        }
    }

    return (
        <div className="space-y-6">

            {/* 1. TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={16} />
                    <input
                        type="text"
                        placeholder="Search vehicles..."
                        className="input input-bordered input-sm w-full pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <select
                        className="select select-bordered select-sm"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2 whitespace-nowrap">
                        <Plus size={16} /> Add Vehicle
                    </button>
                </div>
            </div>

            {/* 2. GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredData.map((v: any) => (
                    <div key={v.id} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden">

                        {/* Header Image */}
                        <div className="h-40 w-full bg-base-200 relative">
                            {v.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-base-content/10"><Car size={48} /></div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(v)} className="btn btn-xs btn-circle btn-ghost bg-base-100 shadow text-primary"><Pencil size={12} /></button>
                                <button onClick={() => handleDelete(v.id)} className="btn btn-xs btn-circle btn-ghost bg-base-100 shadow text-error"><Trash2 size={12} /></button>
                            </div>
                            <div className="absolute bottom-2 left-2 badge badge-sm bg-base-100/90 backdrop-blur border-0 text-xs font-semibold">
                                {v.type}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold leading-tight">{v.name}</h3>
                                    {v.driverName && (
                                        <div className="flex flex-col mt-1 text-xs text-base-content/60 gap-0.5">
                                            <div className="flex items-center gap-1"><User size={10} /> {v.driverName} <span className="opacity-50">({v.plateNumber})</span></div>
                                            {v.contactNumber && <div className="flex items-center gap-1"><Phone size={10} /> {v.contactNumber}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3-Col Pricing */}
                            <div className="grid grid-cols-3 gap-2 text-center border-t border-base-200 pt-3 bg-base-200/30 rounded-lg p-2">
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-base-content/40 mb-1">Day</span>
                                    <span className="font-mono text-xs font-bold text-primary">{formatCurrency(v.ratePerDay, v.currency).replace('.00', '')}</span>
                                </div>
                                <div className="flex flex-col border-l border-base-200/50">
                                    <span className="text-[9px] uppercase font-bold text-base-content/40 mb-1">Km</span>
                                    <span className="font-mono text-xs font-bold text-primary">{formatCurrency(v.ratePerKm, v.currency).replace('.00', '')}</span>
                                </div>
                                <div className="flex flex-col border-l border-base-200/50">
                                    <span className="text-[9px] uppercase font-bold text-base-content/40 mb-1">Allowance</span>
                                    <span className="font-mono text-xs font-bold text-primary">{formatCurrency(v.driverAllowance, v.currency).replace('.00', '')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredData.length === 0 && <div className="col-span-full text-center py-10 opacity-50">No vehicles found.</div>}
            </div>

            {/* 3. MODAL */}
            {isModalOpen && (
                <dialog className="modal modal-open backdrop-blur-sm">
                    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100 shadow-2xl">
                        <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-100">
                            <h3 className="font-bold text-lg">{editingItem ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-circle btn-ghost"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">

                            {/* LEFT: DETAILS */}
                            <div className="md:w-1/3 bg-base-200/50 p-6 space-y-4 border-r border-base-200">
                                <div className="text-xs font-bold text-base-content/40 uppercase tracking-wider">Vehicle Info</div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Image</label>
                                    <ImageUpload name="image" defaultValue={editingItem?.imageUrl} />
                                </div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Name <span className="text-error">*</span></label>
                                    <div className="relative"><Car size={14} className="absolute left-3 top-3 opacity-40" /><input name="name" defaultValue={editingItem?.name} className="input input-bordered input-sm w-full pl-9" required placeholder="e.g. Green Scorpio" /></div>
                                </div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Type</label>
                                    <select name="type" defaultValue={editingItem?.type} className="select select-bordered select-sm w-full">
                                        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="form-control">
                                        <label className="label label-text text-xs font-bold">Plate #</label>
                                        <div className="relative"><Hash size={14} className="absolute left-3 top-3 opacity-40" /><input name="plateNumber" defaultValue={editingItem?.plateNumber} className="input input-bordered input-sm w-full pl-9" placeholder="BA 2 KHA..." /></div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label label-text text-xs font-bold">Driver Name</label>
                                        <div className="relative"><User size={14} className="absolute left-3 top-3 opacity-40" /><input name="driverName" defaultValue={editingItem?.driverName} className="input input-bordered input-sm w-full pl-9" /></div>
                                    </div>
                                </div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Driver Phone</label>
                                    <div className="relative"><Phone size={14} className="absolute left-3 top-3 opacity-40" /><input name="contactNumber" defaultValue={editingItem?.contactNumber} className="input input-bordered input-sm w-full pl-9" placeholder="98XXXXXXXX" /></div>
                                </div>
                            </div>

                            {/* RIGHT: PRICING */}
                            <div className="md:w-2/3 p-6 flex flex-col justify-between">
                                <div>
                                    <div className="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-6">Pricing Configuration</div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-control p-4 border border-base-200 rounded-xl bg-base-100">
                                            <label className="label text-xs font-bold flex items-center gap-2"><Calendar size={14} className="text-primary" /> Day Rate</label>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-base-content/40">NPR</span>
                                                <input name="ratePerDay" defaultValue={editingItem?.ratePerDay} type="number" className="input input-ghost text-xl font-bold w-full p-0 focus:bg-transparent" placeholder="0" />
                                            </div>
                                        </div>

                                        <div className="form-control p-4 border border-base-200 rounded-xl bg-base-100">
                                            <label className="label text-xs font-bold flex items-center gap-2"><Gauge size={14} className="text-secondary" /> Per Km Rate</label>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-base-content/40">NPR</span>
                                                <input name="ratePerKm" defaultValue={editingItem?.ratePerKm} type="number" className="input input-ghost text-xl font-bold w-full p-0 focus:bg-transparent" placeholder="0" />
                                            </div>
                                        </div>

                                        <div className="form-control p-4 border border-base-200 rounded-xl bg-base-100 col-span-full md:col-span-2">
                                            <label className="label text-xs font-bold flex items-center gap-2"><Wallet size={14} className="text-accent" /> Driver Allowance (Per Night)</label>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-base-content/40">NPR</span>
                                                <input name="driverAllowance" defaultValue={editingItem?.driverAllowance} type="number" className="input input-ghost text-xl font-bold w-full p-0 focus:bg-transparent" placeholder="0" />
                                            </div>
                                            <p className="text-[10px] text-base-content/40 mt-1 pl-1">Usually added when the vehicle stays overnight outside base.</p>
                                        </div>
                                    </div>

                                    <input type="hidden" name="currency" value="NPR" />
                                </div>

                                <div className="modal-action border-t border-base-200 pt-4 mt-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
                                    <button type="submit" className="btn btn-primary px-8 gap-2">
                                        <Save size={16} /> Save Vehicle
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                </dialog>
            )}
        </div>
    )
}